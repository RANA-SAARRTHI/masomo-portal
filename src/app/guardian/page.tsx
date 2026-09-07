import Link from "next/link";
import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, StatCard, Table, EmptyState, Badge } from "@/components/ui";
import { clsx } from "clsx";

export default async function GuardianOverview({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const { userId, tenantId } = await requireSession("/guardian");
  const sp = await searchParams;

  const links = await prisma.guardianLink.findMany({
    where: { guardianId: userId, verified: true },
    include: { student: { include: { user: true, classGroup: true } } },
  });

  if (links.length === 0) {
    return (
      <div>
        <PageHeader title="No children linked yet" />
        <Card>
          <EmptyState title="No linked learners" body="Ask the school administrator to link you to your child's record." />
        </Card>
      </div>
    );
  }

  const activeStudentId = sp.child ?? links[0].student.id;
  const active = links.find((l) => l.student.id === activeStudentId)?.student ?? links[0].student;

  const [attendance, marks, invoices, messages] = await Promise.all([
    prisma.attendanceRecord.findMany({ where: { studentId: active.id }, orderBy: { date: "desc" }, take: 10 }),
    prisma.markEntry.findMany({
      where: { studentId: active.id, assessment: { state: "PUBLISHED" } },
      include: { assessment: { include: { subject: true } } },
      take: 10,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.invoice.findMany({ where: { studentId: active.id }, include: { payments: true }, orderBy: { createdAt: "desc" } }),
    prisma.announcement.findMany({
      where: { tenantId, audience: { in: ["ALL", "GUARDIANS", ...(active.classGroupId ? [`CLASS:${active.classGroupId}`] : [])] } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const balance = invoices.reduce((sum, inv) => {
    const paid = inv.payments.filter((p) => p.status === "SUCCESSFUL").reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(inv.amount - paid, 0);
  }, 0);

  return (
    <div>
      <PageHeader title="Family overview" subtitle="Switch between your linked children below." />

      <div className="flex flex-wrap gap-2 mb-6">
        {links.map((l) => (
          <Link
            key={l.student.id}
            href={`/guardian?child=${l.student.id}`}
            className={clsx(
              "px-4 py-2 rounded-full text-sm border",
              l.student.id === active.id ? "bg-brand-600 text-white border-brand-600" : "bg-white border-slate-200 text-slate-600"
            )}
          >
            {l.student.user.name}
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Class" value={active.classGroup?.name ?? "—"} tone="slate" />
        <StatCard label="Outstanding balance" value={`UGX ${Math.round(balance).toLocaleString()}`} tone={balance > 0 ? "amber" : "brand"} />
        <StatCard label="Recent attendance" value={`${attendance.filter((a) => a.status === "PRESENT").length}/${attendance.length || 1}`} tone="brand" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Attendance" subtitle="Last 10 records" />
          {attendance.length === 0 ? (
            <EmptyState title="No records yet" />
          ) : (
            <Table head={["Date", "Status"]}>
              {attendance.map((a) => (
                <tr key={a.id}>
                  <td className="py-2.5 px-3">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="py-2.5 px-3">
                    <Badge tone={a.status === "PRESENT" ? "emerald" : a.status === "ABSENT" ? "rose" : "amber"}>{a.status}</Badge>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Published results"
            action={
              <Link href={`/report-card?studentId=${active.id}`} className="text-xs text-brand-700 underline">
                Printable report card
              </Link>
            }
          />
          {marks.length === 0 ? (
            <EmptyState title="No published results yet" />
          ) : (
            <Table head={["Subject", "Assessment", "Score"]}>
              {marks.map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{m.assessment.subject.name}</td>
                  <td className="py-2.5 px-3">{m.assessment.name}</td>
                  <td className="py-2.5 px-3">{m.state === "ENTERED" ? `${m.score}/${m.assessment.maxMark}` : m.state}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Fee statement" />
          {invoices.length === 0 ? (
            <EmptyState title="No invoices yet" />
          ) : (
            <Table head={["Reference", "Description", "Amount", "Status"]}>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-2.5 px-3">{inv.reference}</td>
                  <td className="py-2.5 px-3">{inv.description}</td>
                  <td className="py-2.5 px-3">UGX {Math.round(inv.amount).toLocaleString()}</td>
                  <td className="py-2.5 px-3">
                    <Badge tone={inv.status === "PAID" ? "emerald" : inv.status === "PART_PAID" ? "amber" : "rose"}>{inv.status}</Badge>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Notices" />
          {messages.length === 0 ? (
            <EmptyState title="No notices yet" />
          ) : (
            <div className="p-4 sm:p-5 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="border-b border-slate-50 pb-2 last:border-0 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{m.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{m.body}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
