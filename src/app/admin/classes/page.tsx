import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, Button, Input, Label } from "@/components/ui";
import { createClassGroup, createSubject } from "@/lib/actions/admin";

export default async function ClassesPage() {
  const { tenantId } = await requireSession("/admin");
  const [classGroups, subjects] = await Promise.all([
    prisma.classGroup.findMany({ where: { tenantId }, include: { students: true }, orderBy: { name: "asc" } }),
    prisma.subject.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Classes & subjects" subtitle="The academic structure your school is built on." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Classes" subtitle={`${classGroups.length} classes`} />
          <Table head={["Class", "Level", "Students"]}>
            {classGroups.map((c) => (
              <tr key={c.id}>
                <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{c.name}</td>
                <td className="py-2.5 px-3">{c.level ?? "—"}</td>
                <td className="py-2.5 px-3">{c.students.length}</td>
              </tr>
            ))}
          </Table>
          <form action={createClassGroup} className="p-4 sm:p-5 border-t border-slate-100 grid sm:grid-cols-2 gap-3 dark:border-slate-800">
            <div>
              <Label>Class name</Label>
              <Input name="name" required placeholder="e.g. S4 East" />
            </div>
            <div>
              <Label>Level</Label>
              <Input name="level" placeholder="e.g. Senior 4" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Add class</Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Subjects" subtitle={`${subjects.length} subjects`} />
          <Table head={["Subject", "Code"]}>
            {subjects.map((s) => (
              <tr key={s.id}>
                <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{s.name}</td>
                <td className="py-2.5 px-3">{s.code}</td>
              </tr>
            ))}
          </Table>
          <form action={createSubject} className="p-4 sm:p-5 border-t border-slate-100 grid sm:grid-cols-2 gap-3 dark:border-slate-800">
            <div>
              <Label>Subject name</Label>
              <Input name="name" required placeholder="e.g. Mathematics" />
            </div>
            <div>
              <Label>Code</Label>
              <Input name="code" required placeholder="e.g. MATH" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Add subject</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
