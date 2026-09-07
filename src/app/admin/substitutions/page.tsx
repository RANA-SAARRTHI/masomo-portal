import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, EmptyState, Button } from "@/components/ui";
import { SubstitutionForm } from "./substitution-form";
import { cancelSubstitution } from "@/lib/actions/substitution";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function SubstitutionsPage() {
  const { tenantId } = await requireSession("/admin");

  const slots = await prisma.timetableSlot.findMany({
    where: { classGroup: { tenantId } },
    include: { subject: true, classGroup: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const allocations = await prisma.teacherAllocation.findMany({
    where: { classGroup: { tenantId } },
    include: { teacher: { include: { user: true } } },
  });
  const teacherFor = (subjectId: string, classGroupId: string) =>
    allocations.find((a) => a.subjectId === subjectId && a.classGroupId === classGroupId)?.teacher.user.name ?? "Unassigned";

  const slotOptions = slots.map((s) => ({
    id: s.id,
    label: `${DAY_NAMES[s.dayOfWeek]} ${s.startTime}-${s.endTime} · ${s.subject.name} · ${s.classGroup.name}`,
    teacherName: teacherFor(s.subjectId, s.classGroupId),
  }));

  const upcoming = await prisma.substitution.findMany({
    where: { timetableSlot: { classGroup: { tenantId } }, date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    include: {
      timetableSlot: { include: { subject: true, classGroup: true } },
      originalTeacher: { include: { user: true } },
      substituteTeacher: { include: { user: true } },
    },
    orderBy: { date: "asc" },
  });

  return (
    <div>
      <PageHeader title="Substitutions" subtitle="Cover an absent teacher's period with someone free at that time." />

      <div className="space-y-6">
        <Card>
          <CardHeader title="Assign a substitute" />
          <div className="p-4 sm:p-5">
            {slotOptions.length === 0 ? (
              <EmptyState title="No timetable periods yet" body="Build the timetable first, then substitutions can be assigned against it." />
            ) : (
              <SubstitutionForm slots={slotOptions} />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Upcoming and today's substitutions" />
          {upcoming.length === 0 ? (
            <EmptyState title="No substitutions scheduled" />
          ) : (
            <Table head={["Date", "Period", "Original teacher", "Substitute", "Reason", ""]}>
              {upcoming.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 px-3">{new Date(s.date).toLocaleDateString()}</td>
                  <td className="py-2.5 px-3">
                    {s.timetableSlot.subject.name} · {s.timetableSlot.classGroup.name} ({s.timetableSlot.startTime}-{s.timetableSlot.endTime})
                  </td>
                  <td className="py-2.5 px-3">{s.originalTeacher.user.name}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{s.substituteTeacher.user.name}</td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{s.reason ?? "—"}</td>
                  <td className="py-2.5 px-3">
                    <form action={cancelSubstitution}>
                      <input type="hidden" name="substitutionId" value={s.id} />
                      <button type="submit" className="text-xs text-rose-600 underline">
                        Cancel
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
