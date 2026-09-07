import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Select, Button, Label, EmptyState } from "@/components/ui";
import { TimetableGrid } from "@/components/timetable-grid";
import { deleteTimetableSlot } from "@/lib/actions/admin";
import { AddPeriodForm } from "./add-period-form";

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
        <form method="get" className="p-4 sm:p-5 border-b border-slate-100 flex items-end gap-3 dark:border-slate-800">
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

        <AddPeriodForm classGroupId={classGroupId ?? ""} subjects={subjects} />
      </Card>
    </div>
  );
}
