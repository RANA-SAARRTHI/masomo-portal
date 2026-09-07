import { requireSession } from "@/lib/guard";
import { getStudentProfile } from "@/lib/student-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, StatCard, Table, EmptyState, Badge } from "@/components/ui";

export default async function StudentAttendancePage() {
  const { userId } = await requireSession("/student");
  const profile = await getStudentProfile(userId);
  if (!profile) return null;

  const records = await prisma.attendanceRecord.findMany({ where: { studentId: profile.id }, orderBy: { date: "desc" }, take: 30 });
  const total = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  const rate = total ? Math.round((present / total) * 100) : 0;

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Your personal attendance summary." />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Attendance rate" value={`${rate}%`} tone={rate >= 90 ? "brand" : "amber"} />
        <StatCard label="Present" value={present} tone="brand" />
        <StatCard label="Records (last 30)" value={total} tone="slate" />
      </div>
      <Card>
        {records.length === 0 ? (
          <EmptyState title="No attendance recorded yet" />
        ) : (
          <Table head={["Date", "Status", "Reason"]}>
            {records.map((r) => (
              <tr key={r.id}>
                <td className="py-2.5 px-3">{new Date(r.date).toLocaleDateString()}</td>
                <td className="py-2.5 px-3">
                  <Badge tone={r.status === "PRESENT" ? "emerald" : r.status === "ABSENT" ? "rose" : "amber"}>{r.status}</Badge>
                </td>
                <td className="py-2.5 px-3 text-slate-500">{r.reason ?? "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
