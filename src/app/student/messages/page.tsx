import { requireSession } from "@/lib/guard";
import { getStudentProfile } from "@/lib/student-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState, Badge } from "@/components/ui";

export default async function StudentMessagesPage() {
  const { tenantId, userId } = await requireSession("/student");
  const profile = await getStudentProfile(userId);

  const audiences = ["ALL", "STUDENTS"];
  if (profile?.classGroupId) audiences.push(`CLASS:${profile.classGroupId}`);

  const messages = await prisma.announcement.findMany({
    where: { tenantId, audience: { in: audiences } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Messages & notices" subtitle="Announcements for you and your class." />
      {messages.length === 0 ? (
        <Card>
          <EmptyState title="No messages yet" />
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{m.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{m.body}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {m.authorName} · {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
                {m.priority !== "NORMAL" && <Badge tone={m.priority === "EMERGENCY" ? "rose" : "amber"}>{m.priority}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
