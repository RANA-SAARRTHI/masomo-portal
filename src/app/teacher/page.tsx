import { requireSession } from "@/lib/guard";
import { getTeacherAllocations } from "@/lib/teacher-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, EmptyState, Badge } from "@/components/ui";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function TeacherHome() {
  const { userId } = await requireSession("/teacher");
  const staff = await getTeacherAllocations(userId);
  const allocations = staff?.allocations ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const covering = staff
    ? await prisma.substitution.findMany({
        where: { substituteTeacherId: staff.id, date: { gte: today, lt: tomorrow } },
        include: { timetableSlot: { include: { subject: true, classGroup: true } } },
      })
    : [];

  return (
    <div>
      <PageHeader title="My classes" subtitle="Only the subjects and classes assigned to you." />

      {covering.length > 0 && (
        <div className="mb-6 space-y-2">
          {covering.map((c) => (
            <div key={c.id} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              You&apos;re covering <strong>{c.timetableSlot.subject.name}</strong> for {c.timetableSlot.classGroup.name} today,{" "}
              {c.timetableSlot.startTime}–{c.timetableSlot.endTime} ({DAY_NAMES[c.timetableSlot.dayOfWeek]}).
              {c.reason ? ` Reason: ${c.reason}.` : ""}
            </div>
          ))}
        </div>
      )}
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
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{a.subject.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{a.classGroup.name}</p>
                </div>
                {a.isClassTeacher ? <Badge tone="brand">Class teacher</Badge> : null}
              </div>
              <p className="text-sm text-slate-400 mt-3 dark:text-slate-500">{a.classGroup.students.length} students</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
