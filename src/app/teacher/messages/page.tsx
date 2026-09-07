import { requireSession } from "@/lib/guard";
import { getTeacherAllocations } from "@/lib/teacher-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Select, Input, Button, Label, EmptyState } from "@/components/ui";
import { postClassMessage } from "@/lib/actions/teacher";

export default async function TeacherMessagesPage() {
  const { userId, tenantId } = await requireSession("/teacher");
  const staff = await getTeacherAllocations(userId);
  const classGroups = Array.from(new Map((staff?.allocations ?? []).map((a) => [a.classGroup.id, a.classGroup])).values());
  const classIds = classGroups.map((c) => `CLASS:${c.id}`);

  const messages = classIds.length
    ? await prisma.announcement.findMany({ where: { tenantId, audience: { in: classIds } }, orderBy: { createdAt: "desc" } })
    : [];

  return (
    <div>
      <PageHeader title="Class messages" subtitle="Send a message to one of your classes." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {messages.length === 0 ? (
            <Card>
              <EmptyState title="No messages sent yet" />
            </Card>
          ) : (
            messages.map((m) => (
              <Card key={m.id} className="p-4">
                <p className="font-medium text-slate-900">{m.title}</p>
                <p className="text-sm text-slate-600 mt-1">{m.body}</p>
                <p className="text-xs text-slate-400 mt-2">{new Date(m.createdAt).toLocaleString()}</p>
              </Card>
            ))
          )}
        </div>
        <Card className="h-fit">
          <CardHeader title="New message" />
          <form action={postClassMessage} className="p-4 sm:p-5 space-y-3">
            <div>
              <Label>Class</Label>
              <Select name="classGroupId" required>
                {classGroups.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input name="title" required placeholder="Message subject" />
            </div>
            <div>
              <Label>Message</Label>
              <textarea name="body" required rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <Button type="submit" className="w-full">
              Send
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
