import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, Badge, Button, Input, Label, Select } from "@/components/ui";
import { createStaff, allocateTeacher, updateUserStatus } from "@/lib/actions/admin";
import { ROLE_LABELS } from "@/lib/roles";

export default async function StaffPage() {
  const { tenantId } = await requireSession("/admin");

  const [staff, subjects, classGroups] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId, role: { not: "STUDENT" }, NOT: { role: "GUARDIAN" } },
      include: { staffProfile: { include: { allocations: { include: { subject: true, classGroup: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subject.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.classGroup.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
  ]);
  const teachers = staff.filter((s) => s.role === "TEACHER");

  return (
    <div>
      <PageHeader title="Staff" subtitle="Everyone who works at your school, and what they can access." />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={`${staff.length} staff members`} />
            <Table head={["Name", "Role", "Staff no.", "Department", "Status"]}>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-900">{s.name}</div>
                    <div className="text-xs text-slate-400">{s.email}</div>
                  </td>
                  <td className="py-2.5 px-3">{ROLE_LABELS[s.role as keyof typeof ROLE_LABELS] ?? s.role}</td>
                  <td className="py-2.5 px-3">{s.staffProfile?.staffNo ?? "—"}</td>
                  <td className="py-2.5 px-3">{s.staffProfile?.department ?? "—"}</td>
                  <td className="py-2.5 px-3">
                    <form action={updateUserStatus}>
                      <input type="hidden" name="userId" value={s.id} />
                      <input type="hidden" name="status" value={s.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} />
                      <button type="submit">
                        <Badge tone={s.status === "ACTIVE" ? "emerald" : "rose"}>{s.status}</Badge>
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card>
            <CardHeader title="Allocate a teacher" subtitle="Give a teacher a subject and class, scoped to only that." />
            <form action={allocateTeacher} className="p-4 sm:p-5 grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Teacher</Label>
                <Select name="teacherId" required>
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.staffProfile?.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Select name="subjectId" required>
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Class</Label>
                <Select name="classGroupId" required>
                  <option value="">Select class</option>
                  {classGroups.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 mt-6">
                <input type="checkbox" name="isClassTeacher" className="rounded" /> Class teacher
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">Allocate</Button>
              </div>
            </form>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Add a staff member" subtitle="Creates the profile and a login." />
          <form action={createStaff} className="p-4 sm:p-5 space-y-3">
            <div>
              <Label>Full name</Label>
              <Input name="name" required placeholder="e.g. Okello Peter" />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" required placeholder="staff@school.ug" />
            </div>
            <div>
              <Label>Staff number</Label>
              <Input name="staffNo" required placeholder="e.g. ST-014" />
            </div>
            <div>
              <Label>Role</Label>
              <Select name="role" defaultValue="TEACHER">
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Administrator</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="BURSAR">Bursar</option>
                <option value="LIBRARIAN">Librarian</option>
                <option value="TRANSPORT_OFFICER">Transport officer</option>
              </Select>
            </div>
            <div>
              <Label>Department</Label>
              <Input name="department" placeholder="e.g. Sciences" />
            </div>
            <Button type="submit" className="w-full">
              Add staff member
            </Button>
            <p className="text-xs text-slate-400">Default password: Masomo@2026</p>
          </form>
        </Card>
      </div>
    </div>
  );
}
