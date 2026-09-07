import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, Badge, Button, Input, EmptyState } from "@/components/ui";
import { decideLeaveRequest } from "@/lib/actions/leave";

const CATEGORY_LABEL: Record<string, string> = {
  SICK: "Sick leave",
  ANNUAL: "Annual leave",
  COMPASSIONATE: "Compassionate leave",
  MATERNITY_PATERNITY: "Maternity / paternity leave",
  OTHER: "Other",
};

export default async function AdminLeavePage() {
  const { tenantId } = await requireSession("/admin");

  const [pending, decided] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { tenantId, status: "PENDING" },
      include: { staff: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: { tenantId, status: { not: "PENDING" } },
      include: { staff: { include: { user: true } } },
      orderBy: { decidedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div>
      <PageHeader title="Staff leave" subtitle="Review and decide leave requests." />

      <div className="space-y-6">
        <Card>
          <CardHeader title={`${pending.length} pending`} />
          {pending.length === 0 ? (
            <EmptyState title="Nothing waiting for a decision" />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pending.map((r) => (
                <div key={r.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{r.staff.user.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {CATEGORY_LABEL[r.category] ?? r.category} · {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                    </p>
                    {r.reason && <p className="text-sm text-slate-400 mt-1 dark:text-slate-500">{r.reason}</p>}
                  </div>
                  <form action={decideLeaveRequest} className="flex gap-2 items-center">
                    <input type="hidden" name="leaveRequestId" value={r.id} />
                    <Input name="decisionNote" placeholder="Note (optional)" className="w-40" />
                    <Button type="submit" name="decision" value="APPROVED">
                      Approve
                    </Button>
                    <Button type="submit" name="decision" value="DECLINED" variant="secondary">
                      Decline
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent decisions" />
          {decided.length === 0 ? (
            <EmptyState title="No decisions yet" />
          ) : (
            <Table head={["Staff", "Category", "Dates", "Status"]}>
              {decided.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{r.staff.user.name}</td>
                  <td className="py-2.5 px-3">{CATEGORY_LABEL[r.category] ?? r.category}</td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                    {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge tone={r.status === "APPROVED" ? "emerald" : "rose"}>{r.status}</Badge>
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
