import Link from "next/link";
import { requireAnySession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { ROLE_HOME, type RoleName } from "@/lib/roles";
import { Card, CardHeader, Table, EmptyState } from "@/components/ui";
import { REPORT_LABEL } from "@/lib/report-data";

export default async function MyReportsPage() {
  const { userId, role } = await requireAnySession();

  const runs = await prisma.exportRun.findMany({
    where: { scheduledReport: { recipientId: userId } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Link href={ROLE_HOME[role as RoleName] ?? "/redirect"} className="text-sm text-brand-700 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 mt-4 mb-1">My scheduled reports</h1>
        <p className="text-sm text-slate-500 mb-6">Reports an administrator has scheduled to be sent to you.</p>

        <Card>
          <CardHeader title="Available downloads" />
          {runs.length === 0 ? (
            <EmptyState title="Nothing here yet" body="Ask an administrator to schedule a report for your account if you expect one." />
          ) : (
            <Table head={["Report", "Rows", "Generated", ""]}>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{REPORT_LABEL[r.type as keyof typeof REPORT_LABEL] ?? r.type}</td>
                  <td className="py-2.5 px-3">{r.rowCount}</td>
                  <td className="py-2.5 px-3 text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
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
