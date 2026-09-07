import { requireSession } from "@/lib/guard";
import { getTeacherAllocations } from "@/lib/teacher-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Select, Input, Button, EmptyState } from "@/components/ui";
import { AttendanceRegister } from "./attendance-register";

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
      <PageHeader title="Attendance" subtitle="Take today's register for your class. Works offline and submits automatically once you're back online." />

      <Card>
        <form method="get" className="p-4 sm:p-5 flex flex-wrap gap-3 items-end border-b border-slate-100 dark:border-slate-800">
          <div className="w-48">
            <label className="text-sm font-medium text-slate-700 block mb-1 dark:text-slate-300">Class</label>
            <Select name="classGroupId" defaultValue={classGroupId}>
              {classGroups.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-48">
            <label className="text-sm font-medium text-slate-700 block mb-1 dark:text-slate-300">Date</label>
            <Input type="date" name="date" defaultValue={date} />
          </div>
          <Button type="submit" variant="secondary">
            Load
          </Button>
        </form>

        {students.length === 0 ? (
          <EmptyState title="No students found" body="Select a class you are assigned to." />
        ) : (
          <AttendanceRegister
            classGroupId={classGroupId ?? ""}
            date={date}
            students={students.map((s) => {
              const record = existingMap.get(s.id);
              return { id: s.id, name: s.user.name, status: record?.status ?? "PRESENT", reason: record?.reason ?? "" };
            })}
          />
        )}
      </Card>
    </div>
  );
}
