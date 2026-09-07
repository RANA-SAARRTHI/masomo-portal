import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, Card, CardHeader, EmptyState, Badge } from "@/components/ui";

export default async function AdminOverview() {
  const { tenantId } = await requireSession("/admin");

  const [students, staff, guardians, openInvoices, unpaidTotal, todayAbsences, announcements] = await Promise.all([
    prisma.user.count({ where: { tenantId, role: "STUDENT" } }),
    prisma.user.count({ where: { tenantId, role: { in: ["TEACHER", "ADMIN", "BURSAR", "PRINCIPAL", "LIBRARIAN", "TRANSPORT_OFFICER"] } } }),
    prisma.user.count({ where: { tenantId, role: "GUARDIAN" } }),
    prisma.invoice.count({ where: { tenantId, status: { in: ["ISSUED", "PART_PAID"] } } }),
    prisma.invoice.aggregate({ where: { tenantId, status: { in: ["ISSUED", "PART_PAID"] } }, _sum: { amount: true } }),
    prisma.attendanceRecord.count({
      where: { student: { user: { tenantId } }, status: "ABSENT", date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.announcement.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <div>
      <PageHeader title="Overview" subtitle="A snapshot of your school right now." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Students" value={students} hint="Active" />
        <StatCard label="Staff" value={staff} hint="All roles" tone="slate" />
        <StatCard label="Guardians" value={guardians} hint="Linked" tone="slate" />
        <StatCard label="Absent today" value={todayAbsences} hint="Flagged" tone={todayAbsences > 0 ? "rose" : "brand"} />
        <StatCard label="Open invoices" value={openInvoices} hint="Unpaid" tone="amber" />
        <StatCard
          label="Outstanding fees"
          value={`UGX ${Math.round(unpaidTotal._sum.amount ?? 0).toLocaleString()}`}
          hint="Total"
          tone="amber"
        />
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent announcements" subtitle="What's gone out to the school community" />
        <div className="p-4 sm:p-5 space-y-3">
          {announcements.length === 0 ? (
            <EmptyState title="No announcements yet" body="Post one from the Announcements page." />
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-900 text-sm">{a.title}</p>
                  <p className="text-sm text-slate-500 line-clamp-1">{a.body}</p>
                </div>
                <Badge tone={a.priority === "EMERGENCY" ? "rose" : a.priority === "IMPORTANT" ? "amber" : "slate"}>
                  {a.priority}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
