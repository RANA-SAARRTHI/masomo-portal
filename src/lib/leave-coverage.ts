import { prisma } from "@/lib/prisma";
import { localDateKey } from "@/lib/dates";

export type AffectedPeriod = {
  timetableSlotId: string;
  date: string; // YYYY-MM-DD
  label: string;
};

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const toDateKey = localDateKey;

// For an approved leave request, work out which of the teacher's timetable
// periods fall inside the leave window and don't already have a substitute
// assigned — the list an admin actually needs to act on.
export async function getAffectedPeriods(leaveRequestId: string): Promise<AffectedPeriod[]> {
  const request = await prisma.leaveRequest.findUnique({ where: { id: leaveRequestId } });
  if (!request || request.status !== "APPROVED") return [];

  const allocations = await prisma.teacherAllocation.findMany({
    where: { teacherId: request.staffId },
    select: { subjectId: true, classGroupId: true },
  });
  if (allocations.length === 0) return [];

  const slots = await prisma.timetableSlot.findMany({
    where: { OR: allocations.map((a) => ({ subjectId: a.subjectId, classGroupId: a.classGroupId })) },
    include: { subject: true, classGroup: true },
  });
  if (slots.length === 0) return [];

  const existingSubs = await prisma.substitution.findMany({
    where: { timetableSlotId: { in: slots.map((s) => s.id) } },
    select: { timetableSlotId: true, date: true },
  });
  const covered = new Set(existingSubs.map((s) => `${s.timetableSlotId}|${toDateKey(s.date)}`));

  const affected: AffectedPeriod[] = [];
  const cursor = new Date(request.startDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(request.endDate);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const jsDay = cursor.getDay();
    const ourDay = jsDay === 0 ? 7 : jsDay;
    for (const slot of slots) {
      if (slot.dayOfWeek !== ourDay) continue;
      const key = `${slot.id}|${toDateKey(cursor)}`;
      if (covered.has(key)) continue;
      affected.push({
        timetableSlotId: slot.id,
        date: toDateKey(cursor),
        label: `${DAY_NAMES[ourDay]} ${toDateKey(cursor)} · ${slot.subject.name} · ${slot.classGroup.name} (${slot.startTime}-${slot.endTime})`,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return affected;
}
