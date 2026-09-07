import Link from "next/link";
import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, Badge, Button, Input, Label, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createStudent, linkGuardian, updateUserStatus } from "@/lib/actions/admin";

export default async function StudentsPage() {
  const { tenantId } = await requireSession("/admin");

  const [students, classGroups] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId, role: "STUDENT" },
      include: { studentProfile: { include: { classGroup: true, guardianLinks: { include: { guardian: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.classGroup.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Students" subtitle="Every learner enrolled at your school." />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={`${students.length} students`} />
            <Table head={["Name", "Admission no.", "Class", "Guardians", "Status", ""]}>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{s.name}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{s.email}</div>
                  </td>
                  <td className="py-2.5 px-3">{s.studentProfile?.admissionNo}</td>
                  <td className="py-2.5 px-3">{s.studentProfile?.classGroup?.name ?? "—"}</td>
                  <td className="py-2.5 px-3">
                    {s.studentProfile?.guardianLinks.length
                      ? s.studentProfile.guardianLinks.map((g) => g.guardian.name).join(", ")
                      : "None linked"}
                  </td>
                  <td className="py-2.5 px-3">
                    <form action={updateUserStatus}>
                      <input type="hidden" name="userId" value={s.id} />
                      <input type="hidden" name="status" value={s.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} />
                      <button type="submit">
                        <Badge tone={s.status === "ACTIVE" ? "emerald" : "rose"}>{s.status}</Badge>
                      </button>
                    </form>
                  </td>
                  <td className="py-2.5 px-3">
                    {s.studentProfile && (
                      <Link href={`/report-card?studentId=${s.studentProfile.id}`} className="text-xs text-brand-700 underline">
                        Report card
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card>
            <CardHeader title="Link a guardian" subtitle="Connect a parent or authorised adult to a student." />
            <form action={linkGuardian} className="p-4 sm:p-5 grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="field-studentid">Student</Label>
                <Select id="field-studentid" name="studentId" required>
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.studentProfile?.id}>
                      {s.name} ({s.studentProfile?.admissionNo})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="field-relationship">Relationship</Label>
                <Select id="field-relationship" name="relationship" defaultValue="Parent">
                  <option>Parent</option>
                  <option>Guardian</option>
                  <option>Sponsor</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="field-guardianname">Guardian name</Label>
                <Input id="field-guardianname" name="guardianName" required placeholder="Full name" />
              </div>
              <div>
                <Label htmlFor="field-guardianemail">Guardian email</Label>
                <Input id="field-guardianemail" name="guardianEmail" type="email" required placeholder="guardian@email.com" />
              </div>
              <div className="sm:col-span-2">
                <SubmitButton>Link guardian</SubmitButton>
              </div>
            </form>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Admit a student" subtitle="Creates the profile and a login." />
          <form action={createStudent} className="p-4 sm:p-5 space-y-3">
            <div>
              <Label htmlFor="field-name">Full name</Label>
              <Input id="field-name" name="name" required placeholder="e.g. Nabirye Grace" />
            </div>
            <div>
              <Label htmlFor="field-email">Email</Label>
              <Input id="field-email" name="email" type="email" required placeholder="student@email.com" />
            </div>
            <div>
              <Label htmlFor="field-admissionno">Admission number</Label>
              <Input id="field-admissionno" name="admissionNo" required placeholder="e.g. MS-2026-014" />
            </div>
            <div>
              <Label htmlFor="field-classgroupid">Class</Label>
              <Select id="field-classgroupid" name="classGroupId">
                <option value="">Unassigned</option>
                {classGroups.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <SubmitButton className="w-full">
              Admit student
            </SubmitButton>
            <p className="text-xs text-slate-400 dark:text-slate-500">Default password: Masomo@2026 (ask them to change it after first login).</p>
          </form>
        </Card>
      </div>
    </div>
  );
}
