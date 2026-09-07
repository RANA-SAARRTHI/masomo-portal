import { requireSession } from "@/lib/guard";
import { getStudentProfile } from "@/lib/student-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, EmptyState, StatCard } from "@/components/ui";

export default async function StudentToday() {
  const { userId } = await requireSession("/student");
  const profile = await getStudentProfile(userId);
  if (!profile) return <EmptyState title="Profile not found" />;

  const subjectIds = profile.classGroupId
    ? (await prisma.teacherAllocation.findMany({ where: { classGroupId: profile.classGroupId }, select: { subjectId: true } })).map((a) => a.subjectId)
    : [];

  const [assignmentsDue, recentMaterials, attendanceStreak] = await Promise.all([
    subjectIds.length
      ? prisma.assignment.findMany({
          where: { subjectId: { in: subjectIds }, dueDate: { gte: new Date() } },
          orderBy: { dueDate: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
    profile.classGroupId
      ? prisma.contentItem.findMany({ where: { audience: profile.classGroupId }, orderBy: { createdAt: "desc" }, take: 5, include: { subject: true } })
      : Promise.resolve([]),
    prisma.attendanceRecord.count({ where: { studentId: profile.id, status: "PRESENT" } }),
  ]);

  return (
    <div>
      <PageHeader title={`Hi, ${profile.user.name.split(" ")[0]}`} subtitle={profile.classGroup ? profile.classGroup.name : "No class assigned"} />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Days present" value={attendanceStreak} tone="brand" />
        <StatCard label="Upcoming assignments" value={assignmentsDue.length} tone="amber" />
        <StatCard label="Admission no." value={profile.admissionNo} tone="slate" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Due soon" />
          {assignmentsDue.length === 0 ? (
            <EmptyState title="Nothing due" />
          ) : (
            <div className="p-4 sm:p-5 space-y-2">
              {assignmentsDue.map((a) => (
                <div key={a.id} className="flex justify-between text-sm border-b border-slate-50 pb-2 last:border-0">
                  <span className="font-medium text-slate-800">{a.title}</span>
                  <span className="text-slate-400">{new Date(a.dueDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Recent materials" />
          {recentMaterials.length === 0 ? (
            <EmptyState title="Nothing posted yet" />
          ) : (
            <div className="p-4 sm:p-5 space-y-2">
              {recentMaterials.map((m) => (
                <div key={m.id} className="text-sm border-b border-slate-50 pb-2 last:border-0">
                  <p className="font-medium text-slate-800">{m.title}</p>
                  <p className="text-slate-400">{m.subject.name}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
