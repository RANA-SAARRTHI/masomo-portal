import { requireSession } from "@/lib/guard";
import { getTeacherAllocations } from "@/lib/teacher-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, Select, Input, Button, Label, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { postMaterial } from "@/lib/actions/teacher";

export default async function MaterialsPage() {
  const { userId } = await requireSession("/teacher");
  const staff = await getTeacherAllocations(userId);
  const allocations = staff?.allocations ?? [];
  const subjectIds = allocations.map((a) => a.subject.id);

  const materials = subjectIds.length
    ? await prisma.contentItem.findMany({ where: { subjectId: { in: subjectIds } }, include: { subject: true }, orderBy: { createdAt: "desc" } })
    : [];

  return (
    <div>
      <PageHeader title="Learning materials" subtitle="Share notes, links and resources with your classes." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Posted materials" />
          {materials.length === 0 ? (
            <EmptyState title="Nothing posted yet" />
          ) : (
            <Table head={["Title", "Subject", "Type", "Posted"]}>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{m.title}</td>
                  <td className="py-2.5 px-3">{m.subject.name}</td>
                  <td className="py-2.5 px-3">{m.type}</td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader title="Post material" />
          <form action={postMaterial} className="p-4 sm:p-5 space-y-3">
            <div>
              <Label htmlFor="field-combo">Subject & class</Label>
              <Select id="field-combo" name="combo" required>
                <option value="">Select</option>
                {allocations.map((a) => (
                  <option key={a.id} value={`${a.subject.id}|${a.classGroup.id}`}>
                    {a.subject.name} — {a.classGroup.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="field-title">Title</Label>
              <Input id="field-title" name="title" required placeholder="e.g. Chapter 4 notes" />
            </div>
            <div>
              <Label htmlFor="field-description">Description</Label>
              <Input id="field-description" name="description" placeholder="Short description" />
            </div>
            <div>
              <Label htmlFor="field-type">Type</Label>
              <Select id="field-type" name="type" defaultValue="DOCUMENT">
                <option value="DOCUMENT">Document</option>
                <option value="LINK">Link</option>
                <option value="VIDEO">Video</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="field-url">Link / URL</Label>
              <Input id="field-url" name="url" placeholder="https://..." />
            </div>
            <SubmitButton className="w-full">
              Publish
            </SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
