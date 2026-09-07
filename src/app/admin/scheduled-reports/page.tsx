import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, Badge, EmptyState } from "@/components/ui";
import { REPORT_LABEL } from "@/lib/report-data";
import { deleteScheduledReport, runScheduledReportNow } from "@/lib/actions/scheduled-reports";
import { RunAllDueButton } from "./run-all-button";
import { CreateScheduleForm } from "./create-schedule-form";

export default async function ScheduledReportsPage() {
  const { tenantId } = await requireSession("/admin");

  const [schedules, eligibleUsers, recentRuns] = await Promise.all([
    prisma.scheduledReport.findMany({ where: { tenantId }, include: { recipient: true }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { tenantId, role: { in: ["ADMIN", "PRINCIPAL", "BURSAR", "PLATFORM_OWNER"] } }, orderBy: { name: "asc" } }),
    prisma.exportRun.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 15 }),
  ]);

  return (
    <div>
      <PageHeader
        title="Scheduled reports"
        subtitle="Every export carries who requested it and when. A schedule can never grant a recipient more than their role already allows."
        action={<RunAllDueButton />}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader title="Active schedules" />
          {schedules.length === 0 ? (
            <EmptyState title="No scheduled reports yet" />
          ) : (
            <Table head={["Report", "Cadence", "Recipient", "Last run", ""]}>
              {schedules.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{REPORT_LABEL[s.type as keyof typeof REPORT_LABEL] ?? s.type}</td>
                  <td className="py-2.5 px-3">
                    <Badge tone="slate">{s.cadence}</Badge>
                  </td>
                  <td className="py-2.5 px-3">{s.recipient.name}</td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : "Never"}</td>
                  <td className="py-2.5 px-3 flex gap-2">
                    <form action={runScheduledReportNow}>
                      <input type="hidden" name="scheduledReportId" value={s.id} />
                      <button type="submit" className="text-xs text-brand-700 underline">
                        Run now
                      </button>
                    </form>
                    <form action={deleteScheduledReport}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="text-xs text-rose-600 underline">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </Table>
          )}

          <CreateScheduleForm eligibleUsers={eligibleUsers} />
        </Card>

        <Card>
          <CardHeader title="Recent runs" />
          {recentRuns.length === 0 ? (
            <EmptyState title="No exports generated yet" />
          ) : (
            <Table head={["Report", "Rows", "Generated", ""]}>
              {recentRuns.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{REPORT_LABEL[r.type as keyof typeof REPORT_LABEL] ?? r.type}</td>
                  <td className="py-2.5 px-3">{r.rowCount}</td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="py-2.5 px-3">
                    <a href={`/api/exports/${r.id}`} className="text-xs text-brand-700 underline">
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
