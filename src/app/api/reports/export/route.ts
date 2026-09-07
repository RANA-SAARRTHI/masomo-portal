import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  // requireSession redirects on failure, which is fine for a route handler too
  // (the browser download link is only ever rendered for an authorised admin).
  const { tenantId } = await requireSession("/admin");
  const type = req.nextUrl.searchParams.get("type") ?? "attendance";

  let rows: Record<string, unknown>[] = [];
  let filename = "export.csv";

  if (type === "attendance") {
    const records = await prisma.attendanceRecord.findMany({
      where: { student: { user: { tenantId } } },
      include: { student: { include: { user: true, classGroup: true } } },
      orderBy: { date: "desc" },
      take: 2000,
    });
    rows = records.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      student: r.student.user.name,
      admission_no: r.student.admissionNo,
      class: r.student.classGroup?.name ?? "",
      status: r.status,
      reason: r.reason ?? "",
    }));
    filename = "attendance-export.csv";
  } else if (type === "fees") {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      include: { student: { include: { user: true } }, payments: true },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });
    rows = invoices.map((inv) => {
      const paid = inv.payments.filter((p) => p.status === "SUCCESSFUL").reduce((s, p) => s + p.amount, 0);
      return {
        reference: inv.reference,
        student: inv.student.user.name,
        description: inv.description,
        amount: inv.amount,
        paid,
        balance: Math.max(inv.amount - paid, 0),
        status: inv.status,
        date: inv.createdAt.toISOString().slice(0, 10),
      };
    });
    filename = "fee-collection-export.csv";
  } else if (type === "students") {
    const students = await prisma.studentProfile.findMany({
      where: { user: { tenantId } },
      include: { user: true, classGroup: true },
      orderBy: { user: { name: "asc" } },
    });
    rows = students.map((s) => ({
      name: s.user.name,
      admission_no: s.admissionNo,
      class: s.classGroup?.name ?? "",
      status: s.status,
      email: s.user.email,
    }));
    filename = "students-export.csv";
  }

  const csv = toCsv(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
