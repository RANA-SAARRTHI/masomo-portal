import { prisma } from "@/lib/prisma";
import { localDateKey } from "@/lib/dates";

export const REPORT_TYPES = ["attendance", "fees", "students"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export async function generateReportRows(tenantId: string, type: ReportType): Promise<Record<string, unknown>[]> {
  if (type === "attendance") {
    const records = await prisma.attendanceRecord.findMany({
      where: { student: { user: { tenantId } } },
      include: { student: { include: { user: true, classGroup: true } } },
      orderBy: { date: "desc" },
      take: 2000,
    });
    return records.map((r) => ({
      date: localDateKey(r.date),
      student: r.student.user.name,
      admission_no: r.student.admissionNo,
      class: r.student.classGroup?.name ?? "",
      status: r.status,
      reason: r.reason ?? "",
    }));
  }

  if (type === "fees") {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      include: { student: { include: { user: true } }, payments: true },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });
    return invoices.map((inv) => {
      const paid = inv.payments.filter((p) => p.status === "SUCCESSFUL").reduce((s, p) => s + p.amount, 0);
      return {
        reference: inv.reference,
        student: inv.student.user.name,
        description: inv.description,
        amount: inv.amount,
        paid,
        balance: Math.max(inv.amount - paid, 0),
        status: inv.status,
        date: localDateKey(inv.createdAt),
      };
    });
  }

  if (type === "students") {
    const students = await prisma.studentProfile.findMany({
      where: { user: { tenantId } },
      include: { user: true, classGroup: true },
      orderBy: { user: { name: "asc" } },
    });
    return students.map((s) => ({
      name: s.user.name,
      admission_no: s.admissionNo,
      class: s.classGroup?.name ?? "",
      status: s.status,
      email: s.user.email,
    }));
  }

  return [];
}

export const REPORT_LABEL: Record<ReportType, string> = {
  attendance: "Attendance",
  fees: "Fee collection",
  students: "Student register",
};

// Which roles are allowed to receive each report type — a schedule can
// never grant access beyond what the recipient's role already has.
export const REPORT_ALLOWED_ROLES: Record<ReportType, string[]> = {
  attendance: ["ADMIN", "PRINCIPAL", "PLATFORM_OWNER"],
  fees: ["ADMIN", "PRINCIPAL", "BURSAR", "PLATFORM_OWNER"],
  students: ["ADMIN", "PRINCIPAL", "PLATFORM_OWNER"],
};
