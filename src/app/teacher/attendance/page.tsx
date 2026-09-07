import { requireSession } from "@/lib/guard";
import { getTeacherAllocations } from "@/lib/teacher-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Select, Input, Button, EmptyState } from "@/components/ui";
import { submitAttendance } from "@/lib/actions/teacher";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classGroupId?: string; date?: string }>;
}) {
  const { userId } = await requireSession("/teacher");
  const sp = await searchParams;
  const staff = await getTeacherAllocations(userId);
  const classGroups = Array.from(new Map((staff?.allocations ?? []).map((a) => [a.classGroup.id, a.classGroup])).values());

  const classGroupId = sp.classGroupId ?? classGroups[0]?.id;
  const date = sp.date ?? new Date().toISOString().slice(0, 10);

  const students = classGroupId
    ? await prisma.studentProfile.findMany({ where: { classGroupId }, include: { user: true }, orderBy: { user: { name: "asc" } } })
    : [];

  const existing = classGroupId
    ? await prisma.attendanceRecord.findMany({ where: { classGroupId, date: new Date(date + "T00:00:00") } })
    : [];
  const existingMap = new Map(existing.map((e) => [e.studentId, e]));

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Take today's register for your class." />

      <Card>
        <form method="get" className="p-4 sm:p-5 flex flex-wrap gap-3 items-end border-b border-slate-100">
          <div className="w-48">
            <label className="text-sm font-medium text-slate-700 block mb-1">Class</label>
            <Select name="classGroupId" defaultValue={classGroupId}>
              {classGroups.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-48">
            <label className="text-sm font-medium text-slate-700 block mb-1">Date</label>
            <Input type="date" name="date" defaultValue={date} />
          </div>
          <Button type="submit" variant="secondary">
            Load
          </Button>
        </form>

        {students.length === 0 ? (
          <EmptyState title="No students found" body="Select a class you are assigned to." />
        ) : (
          <form action={submitAttendance} className="p-4 sm:p-5 space-y-3">
            <input type="hidden" name="classGroupId" value={classGroupId} />
            <input type="hidden" name="date" value={date} />
            {students.map((s) => {
              const record = existingMap.get(s.id);
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-slate-50 pb-3 last:border-0">
                  <input type="hidden" name="studentId" value={s.id} />
                  <span className="font-medium text-slate-800 flex-1 min-w-[10rem]">{s.user.name}</span>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((st) => (
                      <label
                        key={st}
                        className="text-xs px-2 py-1 rounded-full border border-slate-200 has-[:checked]:bg-brand-600 has-[:checked]:text-white has-[:checked]:border-brand-600 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`status-${s.id}`}
                          value={st}
                          defaultChecked={record ? record.status === st : st === "PRESENT"}
                          className="sr-only"
                        />
                        {st}
                      </label>
                    ))}
                  </div>
                  <Input name={`reason-${s.id}`} placeholder="Reason (optional)" defaultValue={record?.reason ?? ""} className="sm:w-48" />
                </div>
              );
            })}
            <Button type="submit">Submit register</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
