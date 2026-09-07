import { requireSession } from "@/lib/guard";
import { getStudentProfile } from "@/lib/student-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { TimetableGrid } from "@/components/timetable-grid";

export default async function StudentTimetablePage() {
  const { userId } = await requireSession("/student");
  const profile = await getStudentProfile(userId);
  const slots = profile?.classGroupId
    ? await prisma.timetableSlot.findMany({ where: { classGroupId: profile.classGroupId }, include: { subject: true } })
    : [];

  return (
    <div>
      <PageHeader title="Timetable" subtitle={profile?.classGroup?.name ?? "No class assigned"} />
      <Card className="p-4 sm:p-5">
        {slots.length === 0 ? (
          <EmptyState title="No timetable published yet" />
        ) : (
          <TimetableGrid
            slots={slots.map((s) => ({ id: s.id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, room: s.room, subjectName: s.subject.name }))}
          />
        )}
      </Card>
    </div>
  );
}
