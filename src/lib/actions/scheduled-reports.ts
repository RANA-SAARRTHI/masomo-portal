"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";
import { toCsv, watermarkCsv } from "@/lib/exports";
import { generateReportRows, REPORT_ALLOWED_ROLES, REPORT_LABEL, type ReportType } from "@/lib/report-data";

export async function createScheduledReport(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const type = String(formData.get("type") ?? "") as ReportType;
  const cadence = String(formData.get("cadence") ?? "");
  const recipientId = String(formData.get("recipientId") ?? "");
  if (!type || !cadence || !recipientId) throw new Error("All fields are required.");

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient || recipient.tenantId !== tenantId) throw new Error("Recipient not found.");
  // A schedule can never grant a recipient access their role doesn't already have.
  if (!REPORT_ALLOWED_ROLES[type]?.includes(recipient.role)) {
    throw new Error(`${recipient.name}'s role does not have access to ${REPORT_LABEL[type] ?? type} reports.`);
  }

  await prisma.scheduledReport.create({
    data: { tenantId, type, cadence, recipientId, createdById: userId },
  });
  await prisma.auditLog.create({ data: { tenantId, actorId: userId, action: "CREATE_SCHEDULED_REPORT" } });
  revalidatePath("/admin/scheduled-reports");
}

export async function deleteScheduledReport(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const existing = await prisma.scheduledReport.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error("Not found.");
  await prisma.scheduledReport.delete({ where: { id } });
  await prisma.auditLog.create({ data: { tenantId, actorId: userId, action: "DELETE_SCHEDULED_REPORT", target: id } });
  revalidatePath("/admin/scheduled-reports");
}

export async function runScheduledReportNow(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const scheduledReportId = String(formData.get("scheduledReportId") ?? "");
  if (!scheduledReportId) throw new Error("Missing schedule.");

  const schedule = await prisma.scheduledReport.findUniqueOrThrow({
    where: { id: scheduledReportId },
    include: { recipient: true, tenant: true },
  });
  if (schedule.tenantId !== tenantId) throw new Error("Not found.");

  const rows = await generateReportRows(tenantId, schedule.type as ReportType);
  const csv = watermarkCsv(toCsv(rows), {
    tenantName: schedule.tenant.name,
    requestedBy: schedule.recipient.name,
    requestedByEmail: schedule.recipient.email,
    generatedAt: new Date(),
    purpose: `Scheduled ${schedule.cadence.toLowerCase()} ${REPORT_LABEL[schedule.type as ReportType] ?? schedule.type} report`,
  });

  await prisma.exportRun.create({
    data: { tenantId, scheduledReportId, type: schedule.type, requestedById: userId, rowCount: rows.length, content: csv },
  });
  await prisma.scheduledReport.update({ where: { id: scheduledReportId }, data: { lastRunAt: new Date() } });
  await prisma.auditLog.create({ data: { tenantId, actorId: userId, action: "RUN_SCHEDULED_REPORT", target: scheduledReportId } });

  revalidatePath("/admin/scheduled-reports");
  revalidatePath("/account/reports");
}

export async function runAllDueReports() {
  const { tenantId, userId } = await requireSession("/admin");
  const schedules = await prisma.scheduledReport.findMany({ where: { tenantId }, include: { recipient: true, tenant: true } });

  const now = Date.now();
  const dueMs: Record<string, number> = { WEEKLY: 7 * 86400000, MONTHLY: 30 * 86400000 };
  let ran = 0;

  for (const schedule of schedules) {
    const interval = dueMs[schedule.cadence] ?? dueMs.WEEKLY;
    const due = !schedule.lastRunAt || now - schedule.lastRunAt.getTime() >= interval;
    if (!due) continue;

    const rows = await generateReportRows(tenantId, schedule.type as ReportType);
    const csv = watermarkCsv(toCsv(rows), {
      tenantName: schedule.tenant.name,
      requestedBy: schedule.recipient.name,
      requestedByEmail: schedule.recipient.email,
      generatedAt: new Date(),
      purpose: `Scheduled ${schedule.cadence.toLowerCase()} ${REPORT_LABEL[schedule.type as ReportType] ?? schedule.type} report`,
    });
    await prisma.exportRun.create({
      data: { tenantId, scheduledReportId: schedule.id, type: schedule.type, requestedById: userId, rowCount: rows.length, content: csv },
    });
    await prisma.scheduledReport.update({ where: { id: schedule.id }, data: { lastRunAt: new Date() } });
    ran++;
  }

  if (ran > 0) {
    await prisma.auditLog.create({ data: { tenantId, actorId: userId, action: "RUN_DUE_REPORTS", target: `${ran} reports` } });
  }
  revalidatePath("/admin/scheduled-reports");
  revalidatePath("/account/reports");
  return { ran };
}
