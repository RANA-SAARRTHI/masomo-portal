import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, Badge, EmptyState } from "@/components/ui";

function lastWeekdays(n: number): Date[] {
  const days: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (days.length < n) {
    const dow = d.getDay(); // 0=Sun..6=Sat
    if (dow !== 0 && dow !== 6) days.push(new Date(d));
    d.setDate(d.getDate() - 1);
  }
  return days;
}

export default async function DataQualityPage() {
  const { tenantId } = await requireSession("/admin");

  const [classGroups, students, assessmentsInReview, staleInvoices, staffAccounts, recentLogins] = await Promise.all([
    prisma.classGroup.findMany({ where: { tenantId }, include: { students: true } }),
    prisma.studentProfile.findMany({ where: { user: { tenantId } }, include: { user: true, guardianLinks: true } }),
    prisma.assessment.findMany({
      where: { subject: { tenantId }, state: { in: ["SUBMITTED", "APPROVED"] } },
      include: { subject: true, term: true, marks: true },
    }),
    prisma.invoice.findMany({
      where: { tenantId, status: { in: ["ISSUED", "PART_PAID"] }, createdAt: { lt: new Date(Date.now() - 30 * 86400000) } },
      include: { student: { include: { user: true } } },
    }),
    prisma.user.findMany({ where: { tenantId, role: { in: ["ADMIN", "PRINCIPAL", "BURSAR", "PLATFORM_OWNER"] } } }),
    prisma.auditLog.findMany({ where: { tenantId, action: "LOGIN" }, orderBy: { createdAt: "desc" } }),
  ]);

  // Missing registers: a class with at least one enrolled student but zero
  // attendance rows on a recent weekday is a register nobody took.
  const checkDays = lastWeekdays(5);
  const attendanceDates = await prisma.attendanceRecord.findMany({
    where: { classGroupId: { in: classGroups.map((c) => c.id) }, date: { in: checkDays } },
    select: { classGroupId: true, date: true },
  });
  const coveredKey = new Set(attendanceDates.map((a) => `${a.classGroupId}|${a.date.toDateString()}`));
  const missingRegisters: { className: string; date: Date }[] = [];
  for (const c of classGroups) {
    if (c.students.length === 0) continue;
    for (const day of checkDays) {
      if (!coveredKey.has(`${c.id}|${day.toDateString()}`)) {
        missingRegisters.push({ className: c.name, date: day });
      }
    }
  }

  const studentsWithoutGuardian = students.filter((s) => s.guardianLinks.length === 0);

  const incompleteAssessments = assessmentsInReview
    .map((a) => ({ ...a, enrolled: a.marks.length, blank: a.marks.filter((m) => m.state === "BLANK" || m.score == null).length }))
    .filter((a) => a.blank > 0);

  const lastLoginByUser = new Map(recentLogins.map((l) => [l.actorId, l.createdAt]));
  const dormantPrivileged = staffAccounts.filter((u) => !lastLoginByUser.has(u.id));

  const totalIssues =
    missingRegisters.length + studentsWithoutGuardian.length + incompleteAssessments.length + staleInvoices.length + dormantPrivileged.length;

  return (
    <div>
      <PageHeader
        title="Data quality"
        subtitle={totalIssues === 0 ? "No issues found right now." : `${totalIssues} item${totalIssues === 1 ? "" : "s"} worth a look.`}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader title="Missing attendance registers" subtitle="Classes with no register taken on a recent school day" />
          {missingRegisters.length === 0 ? (
            <EmptyState title="All recent registers are in" />
          ) : (
            <Table head={["Class", "Date"]}>
              {missingRegisters.slice(0, 30).map((m, i) => (
                <tr key={i}>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{m.className}</td>
                  <td className="py-2.5 px-3 text-slate-500">{m.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Students without a linked guardian" />
          {studentsWithoutGuardian.length === 0 ? (
            <EmptyState title="Every student has at least one linked guardian" />
          ) : (
            <Table head={["Student", "Admission no."]}>
              {studentsWithoutGuardian.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{s.user.name}</td>
                  <td className="py-2.5 px-3 text-slate-500">{s.admissionNo}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Assessments with unentered marks" subtitle="Submitted or moderated but still missing scores" />
          {incompleteAssessments.length === 0 ? (
            <EmptyState title="Nothing incomplete" />
          ) : (
            <Table head={["Subject", "Assessment", "Term", "Missing"]}>
              {incompleteAssessments.map((a) => (
                <tr key={a.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{a.subject.name}</td>
                  <td className="py-2.5 px-3">{a.name}</td>
                  <td className="py-2.5 px-3">{a.term.name}</td>
                  <td className="py-2.5 px-3">
                    <Badge tone="amber">{a.blank} of {a.enrolled}</Badge>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Invoices unpaid for over 30 days" />
          {staleInvoices.length === 0 ? (
            <EmptyState title="No stale invoices" />
          ) : (
            <Table head={["Student", "Reference", "Amount", "Status"]}>
              {staleInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{inv.student.user.name}</td>
                  <td className="py-2.5 px-3">{inv.reference}</td>
                  <td className="py-2.5 px-3">UGX {Math.round(inv.amount).toLocaleString()}</td>
                  <td className="py-2.5 px-3">
                    <Badge tone="rose">{inv.status}</Badge>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Privileged accounts that have never logged in" subtitle="Admin, principal, bursar and platform-owner accounts" />
          {dormantPrivileged.length === 0 ? (
            <EmptyState title="Every privileged account has logged in at least once" />
          ) : (
            <Table head={["Name", "Role", "Created"]}>
              {dormantPrivileged.map((u) => (
                <tr key={u.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{u.name}</td>
                  <td className="py-2.5 px-3">{u.role}</td>
                  <td className="py-2.5 px-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
