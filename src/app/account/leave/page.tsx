import Link from "next/link";
import { requireAnySession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { ROLE_HOME, type RoleName } from "@/lib/roles";
import { Card, CardHeader, Table, Badge, Button, Input, Label, Select, EmptyState } from "@/components/ui";
import { submitLeaveRequest } from "@/lib/actions/leave";

const CATEGORY_LABEL: Record<string, string> = {
  SICK: "Sick leave",
  ANNUAL: "Annual leave",
  COMPASSIONATE: "Compassionate leave",
  MATERNITY_PATERNITY: "Maternity / paternity leave",
  OTHER: "Other",
};

export default async function MyLeavePage() {
  const { userId, role } = await requireAnySession();
  const staff = await prisma.staffProfile.findUnique({ where: { userId } });

  const requests = staff
    ? await prisma.leaveRequest.findMany({ where: { staffId: staff.id }, orderBy: { createdAt: "desc" } })
    : [];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-800">
      <div className="max-w-2xl mx-auto">
        <Link href={ROLE_HOME[role as RoleName] ?? "/redirect"} className="text-sm text-brand-700 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 mt-4 mb-1 dark:text-slate-100">Leave requests</h1>
        <p className="text-sm text-slate-500 mb-6 dark:text-slate-400">Request time off and track approval.</p>

        {!staff ? (
          <Card>
            <EmptyState title="Not available" body="Leave requests are for staff accounts only." />
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Request leave" />
              <form action={submitLeaveRequest} className="p-4 sm:p-5 grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select name="category" required defaultValue="ANNUAL">
                    <option value="SICK">Sick leave</option>
                    <option value="ANNUAL">Annual leave</option>
                    <option value="COMPASSIONATE">Compassionate leave</option>
                    <option value="MATERNITY_PATERNITY">Maternity / paternity leave</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </div>
                <div />
                <div>
                  <Label>Start date</Label>
                  <Input type="date" name="startDate" required />
                </div>
                <div>
                  <Label>End date</Label>
                  <Input type="date" name="endDate" required />
                </div>
                <div className="sm:col-span-2">
                  <Label>Reason (optional)</Label>
                  <Input name="reason" placeholder="Brief reason" />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit">Submit request</Button>
                </div>
              </form>
            </Card>

            <Card>
              <CardHeader title="Your requests" />
              {requests.length === 0 ? (
                <EmptyState title="No leave requests yet" />
              ) : (
                <Table head={["Category", "Dates", "Status", "Note"]}>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 px-3">{CATEGORY_LABEL[r.category] ?? r.category}</td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                        {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge tone={r.status === "APPROVED" ? "emerald" : r.status === "DECLINED" ? "rose" : "amber"}>{r.status}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{r.decisionNote ?? "—"}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
