"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";

export type ImportRow = {
  line: number;
  name: string;
  email: string;
  admissionNo: string;
  className: string;
  errors: string[];
};

export type ImportPreview = {
  valid: ImportRow[];
  invalid: ImportRow[];
  totalRows: number;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

// Step 1: parse and validate only. Nothing is written to the database yet —
// this is the "validation-only import" dry run before anyone commits data.
export async function previewStudentImport(csvText: string): Promise<ImportPreview> {
  const { tenantId } = await requireSession("/admin");
  const rows = parseCsv(csvText);
  if (rows.length === 0) return { valid: [], invalid: [], totalRows: 0 };

  const header = rows[0].map((h) => h.toLowerCase());
  const hasHeader = header.includes("name") && header.includes("email");
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const [existingEmails, existingAdmissionNos, classGroups] = await Promise.all([
    prisma.user.findMany({ where: { tenantId }, select: { email: true } }).then((r) => new Set(r.map((u) => u.email))),
    prisma.studentProfile
      .findMany({ where: { user: { tenantId } }, select: { admissionNo: true } })
      .then((r) => new Set(r.map((s) => s.admissionNo))),
    prisma.classGroup.findMany({ where: { tenantId }, select: { name: true } }),
  ]);
  const classNames = new Set(classGroups.map((c) => c.name.toLowerCase()));

  const seenEmails = new Set<string>();
  const seenAdmissionNos = new Set<string>();

  const parsed: ImportRow[] = dataRows.map((cols, idx) => {
    const [name = "", email = "", admissionNo = "", className = ""] = cols;
    const errors: string[] = [];
    const cleanEmail = email.toLowerCase();

    if (!name) errors.push("Missing name");
    if (!email) errors.push("Missing email");
    else if (!EMAIL_RE.test(email)) errors.push("Invalid email format");
    if (!admissionNo) errors.push("Missing admission number");

    if (email && existingEmails.has(cleanEmail)) errors.push("Email already exists at this school");
    if (email && seenEmails.has(cleanEmail)) errors.push("Duplicate email in this file");
    if (admissionNo && existingAdmissionNos.has(admissionNo)) errors.push("Admission number already exists");
    if (admissionNo && seenAdmissionNos.has(admissionNo)) errors.push("Duplicate admission number in this file");
    if (className && !classNames.has(className.toLowerCase())) errors.push(`Unknown class "${className}" (will be left unassigned)`);

    if (email) seenEmails.add(cleanEmail);
    if (admissionNo) seenAdmissionNos.add(admissionNo);

    return { line: idx + (hasHeader ? 2 : 1), name, email, admissionNo, className, errors };
  });

  // A row is only blocked by errors that would corrupt data — an unknown
  // class name is a warning, not a reason to refuse the whole row.
  const blocking = (r: ImportRow) => r.errors.some((e) => !e.startsWith("Unknown class"));

  return {
    valid: parsed.filter((r) => !blocking(r)),
    invalid: parsed.filter(blocking),
    totalRows: parsed.length,
  };
}

// Step 2: commit only the rows the admin has seen pass validation. Re-checks
// duplicates at write time in case another admission happened in between.
export async function commitStudentImport(csvText: string): Promise<{ created: number; skipped: number }> {
  const { tenantId, userId } = await requireSession("/admin");
  const preview = await previewStudentImport(csvText);

  const classGroups = await prisma.classGroup.findMany({ where: { tenantId } });
  const classByName = new Map(classGroups.map((c) => [c.name.toLowerCase(), c.id]));
  const passwordHash = await bcrypt.hash("Masomo@2026", 10);

  let created = 0;
  let skipped = 0;

  for (const row of preview.valid) {
    const email = row.email.toLowerCase();
    const exists = await prisma.user.findFirst({ where: { tenantId, email } });
    if (exists) {
      skipped++;
      continue;
    }
    const classGroupId = row.className ? classByName.get(row.className.toLowerCase()) ?? null : null;
    await prisma.user.create({
      data: {
        tenantId,
        name: row.name,
        email,
        role: "STUDENT",
        passwordHash,
        studentProfile: { create: { admissionNo: row.admissionNo, classGroupId } },
      },
    });
    created++;
  }

  await prisma.auditLog.create({
    data: {
      tenantId,
      actorId: userId,
      action: "BULK_IMPORT_STUDENTS",
      target: `created=${created} skipped=${skipped} invalidRows=${preview.invalid.length}`,
    },
  });

  revalidatePath("/admin/students");
  return { created, skipped };
}
