import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Badge, Button, Input, Label, Select, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { postAnnouncement } from "@/lib/actions/admin";

export default async function AnnouncementsPage() {
  const { tenantId } = await requireSession("/admin");
  const announcements = await prisma.announcement.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Reach the whole school, a group, or just staff." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {announcements.length === 0 ? (
            <Card>
              <EmptyState title="No announcements yet" body="Post the first one using the form." />
            </Card>
          ) : (
            announcements.map((a) => (
              <Card key={a.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{a.title}</p>
                    <p className="text-sm text-slate-600 mt-1 dark:text-slate-400">{a.body}</p>
                    <p className="text-xs text-slate-400 mt-2 dark:text-slate-500">
                      {a.authorName} · {a.audience} · {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge tone={a.priority === "EMERGENCY" ? "rose" : a.priority === "IMPORTANT" ? "amber" : "slate"}>
                    {a.priority}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>

        <Card className="h-fit">
          <CardHeader title="Post an announcement" />
          <form action={postAnnouncement} className="p-4 sm:p-5 space-y-3">
            <div>
              <Label htmlFor="field-title">Title</Label>
              <Input id="field-title" name="title" required placeholder="e.g. Term 3 begins Monday" />
            </div>
            <div>
              <Label htmlFor="field-body">Message</Label>
              <textarea id="field-body"
                name="body"
                required
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700"
                placeholder="Write your announcement..."
              />
            </div>
            <div>
              <Label htmlFor="field-audience">Audience</Label>
              <Select id="field-audience" name="audience" defaultValue="ALL">
                <option value="ALL">Whole school</option>
                <option value="STAFF">Staff only</option>
                <option value="GUARDIANS">Guardians</option>
                <option value="STUDENTS">Students</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="field-priority">Priority</Label>
              <Select id="field-priority" name="priority" defaultValue="NORMAL">
                <option value="NORMAL">Normal</option>
                <option value="IMPORTANT">Important (needs acknowledgement)</option>
                <option value="EMERGENCY">Emergency</option>
              </Select>
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
