import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Select, Input, Button, Label, EmptyState } from "@/components/ui";
import { TimetableGrid } from "@/components/timetable-grid";
import { createTimetableSlot, deleteTimetableSlot } from "@/lib/actions/admin";

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ classGroupId?: string }> }) {
  const { tenantId } = await requireSession("/admin");
  const sp = await searchParams;

  const [classGroups, subjects] = await Promise.all([
    prisma.classGroup.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.subject.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
  ]);

  const classGroupId = sp.classGroupId ?? classGroups[0]?.id;
  const slots = classGroupId
    ? await prisma.timetableSlot.findMany({ where: { classGroupId }, include: { subject: true } })
    : [];

  return (
    <div>
      <PageHeader title="Timetable" subtitle="Build the weekly schedule for each class." />

      <Card>
        <form method="get" className="p-4 sm:p-5 border-b border-slate-100 flex items-end gap-3">
          <div className="w-56">
            <Label>Class</Label>
            <Select name="classGroupId" defaultValue={classGroupId}>
              {classGroups.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            View
          </Button>
        </form>

        <div className="p-4 sm:p-5">
          {slots.length === 0 ? (
            <EmptyState title="No periods scheduled yet" body="Add the first period using the form below." />
          ) : (
            <TimetableGrid
              slots={slots.map((s) => ({
                id: s.id,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                room: s.room,
                subjectName: s.subject.name,
                extra: (
                  <form action={deleteTimetableSlot} className="mt-1">
                    <input type="hidden" name="slotId" value={s.id} />
                    <button type="submit" className="text-[10px] text-rose-500 hover:underline">
                      Remove
                    </button>
                  </form>
                ),
              }))}
            />
          )}
        </div>

        <form action={createTimetableSlot} className="p-4 sm:p-5 border-t border-slate-100 grid sm:grid-cols-6 gap-3 items-end">
          <input type="hidden" name="classGroupId" value={classGroupId} />
          <div className="sm:col-span-2">
            <Label>Subject</Label>
            <Select name="subjectId" required>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Day</Label>
            <Select name="dayOfWeek" defaultValue="1">
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
            </Select>
          </div>
          <div>
            <Label>Start</Label>
            <Input type="time" name="startTime" required defaultValue="08:00" />
          </div>
          <div>
            <Label>End</Label>
            <Input type="time" name="endTime" required defaultValue="08:40" />
          </div>
          <div>
            <Label>Room</Label>
            <Input name="room" placeholder="e.g. Lab 2" />
          </div>
          <div className="sm:col-span-6">
            <Button type="submit">Add period</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
