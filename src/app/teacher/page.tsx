import { requireSession } from "@/lib/guard";
import { getTeacherAllocations } from "@/lib/teacher-context";
import { PageHeader, Card, CardHeader, EmptyState, Badge } from "@/components/ui";

export default async function TeacherHome() {
  const { userId } = await requireSession("/teacher");
  const staff = await getTeacherAllocations(userId);
  const allocations = staff?.allocations ?? [];

  return (
    <div>
      <PageHeader title="My classes" subtitle="Only the subjects and classes assigned to you." />
      {allocations.length === 0 ? (
        <Card>
          <EmptyState title="No classes assigned yet" body="Ask your administrator to allocate you to a subject and class." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allocations.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{a.subject.name}</p>
                  <p className="text-sm text-slate-500">{a.classGroup.name}</p>
                </div>
                {a.isClassTeacher ? <Badge tone="brand">Class teacher</Badge> : null}
              </div>
              <p className="text-sm text-slate-400 mt-3">{a.classGroup.students.length} students</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
