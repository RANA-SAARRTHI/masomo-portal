"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";

// requireSession("/admin") already restricts this whole area to
// ADMIN / PRINCIPAL / PLATFORM_OWNER — ordinary teachers have no route into
// it at all, which is the strictest form of the spec's "need-to-know" rule.

export async function createWellbeingRecord(formData: FormData) {
  const { tenantId, userId, name } = await requireSession("/admin");
  const studentId = String(formData.get("studentId") ?? "");
  const category = String(formData.get("category") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  if (!studentId || !category || !description) return;

  const student = await prisma.studentProfile.findFirst({ where: { id: studentId, user: { tenantId } } });
  if (!student) throw new Error("Student not found.");

  await prisma.wellbeingRecord.create({
    data: { tenantId, studentId, category, description, caseOwnerName: name, createdById: userId },
  });
  await prisma.auditLog.create({
    data: { tenantId, actorId: userId, action: "CREATE_WELLBEING_RECORD", target: studentId },
  });
  revalidatePath("/admin/wellbeing");
}

export async function updateWellbeingRecord(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const recordId = String(formData.get("recordId") ?? "");
  const status = String(formData.get("status") ?? "");
  const actionTaken = String(formData.get("actionTaken") ?? "").trim();
  if (!recordId) return;

  const existing = await prisma.wellbeingRecord.findFirst({ where: { id: recordId, tenantId } });
  if (!existing) throw new Error("Not found.");

  await prisma.wellbeingRecord.update({
    where: { id: recordId },
    data: { status: status || undefined, actionTaken: actionTaken || undefined },
  });
  await prisma.auditLog.create({
    data: { tenantId, actorId: userId, action: "UPDATE_WELLBEING_RECORD", target: recordId },
  });
  revalidatePath("/admin/wellbeing");
}
