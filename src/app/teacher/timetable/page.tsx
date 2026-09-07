import { requireSession } from "@/lib/guard";
import { getTeacherAllocations } from "@/lib/teacher-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { TimetableGrid } from "@/components/timetable-grid";

export default async function TeacherTimetablePage() {
  const { userId } = await requireSession("/teacher");
  const staff = await getTeacherAllocations(userId);
  const pairs = (staff?.allocations ?? []).map((a) => ({ subjectId: a.subject.id, classGroupId: a.classGroup.id }));

  const slots = pairs.length
    ? await prisma.timetableSlot.findMany({
        where: { OR: pairs.map((p) => ({ subjectId: p.subjectId, classGroupId: p.classGroupId })) },
        include: { subject: true, classGroup: true },
      })
    : [];

  return (
    <div>
      <PageHeader title="My timetable" subtitle="Every period across your assigned classes." />
      <Card className="p-4 sm:p-5">
        {slots.length === 0 ? (
          <EmptyState title="No periods scheduled yet" />
        ) : (
          <TimetableGrid
            slots={slots.map((s) => ({
              id: s.id,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              room: s.room,
              subjectName: `${s.subject.name} · ${s.classGroup.name}`,
            }))}
          />
        )}
      </Card>
    </div>
  );
}
