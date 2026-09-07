import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader } from "@/components/ui";
import { BarStat, PieStat } from "@/components/charts";

function ExportLinks() {
  const links = [
    { type: "attendance", label: "Attendance CSV" },
    { type: "fees", label: "Fee collection CSV" },
    { type: "students", label: "Students CSV" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <a
          key={l.type}
          href={`/api/reports/export?type=${l.type}`}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
        >
          ⭳ {l.label}
        </a>
      ))}
    </div>
  );
}

export default async function ReportsPage() {
  const { tenantId } = await requireSession("/admin");

  const [classGroups, attendanceCounts, invoices] = await Promise.all([
    prisma.classGroup.findMany({ where: { tenantId }, include: { students: true } }),
    prisma.attendanceRecord.groupBy({
      by: ["status"],
      where: { student: { user: { tenantId } } },
      _count: { status: true },
    }),
    prisma.invoice.findMany({ where: { tenantId }, include: { payments: true } }),
  ]);

  const classData = classGroups.map((c) => ({ name: c.name, students: c.students.length }));
  const attendanceData = attendanceCounts.map((a) => ({ name: a.status, value: a._count.status }));

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalCollected = invoices.reduce(
    (sum, i) => sum + i.payments.filter((p) => p.status === "SUCCESSFUL").reduce((s, p) => s + p.amount, 0),
    0
  );
  const feeData = [
    { name: "Collected", value: Math.round(totalCollected) },
    { name: "Outstanding", value: Math.round(Math.max(totalInvoiced - totalCollected, 0)) },
  ];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Attendance, enrolment and fee collection at a glance."
        action={<ExportLinks />}
      />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Students per class" />
          <div className="p-4">
            <BarStat data={classData} dataKey="students" labelKey="name" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Attendance breakdown" subtitle="All time" />
          <div className="p-4">
            <PieStat data={attendanceData.length ? attendanceData : [{ name: "No data yet", value: 1 }]} />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Fee collection" subtitle={`UGX ${Math.round(totalInvoiced).toLocaleString()} invoiced in total`} />
          <div className="p-4">
            <PieStat data={feeData} />
          </div>
        </Card>
      </div>
    </div>
  );
}
