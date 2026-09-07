import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, Badge, EmptyState } from "@/components/ui";
import { ModerateCard, PublishCard } from "./moderation-actions";

export default async function ModerationPage() {
  const { tenantId, role } = await requireSession("/admin");
  const canPublish = role === "PRINCIPAL" || role === "PLATFORM_OWNER";

  const submitted = await prisma.assessment.findMany({
    where: { subject: { tenantId }, state: "SUBMITTED" },
    include: { subject: true, term: true, marks: true },
    orderBy: { id: "desc" },
  });

  const approved = await prisma.assessment.findMany({
    where: { subject: { tenantId }, state: "APPROVED" },
    include: { subject: true, term: true, marks: true },
    orderBy: { moderatedAt: "desc" },
  });

  const recentlyPublished = await prisma.assessment.findMany({
    where: { subject: { tenantId }, state: "PUBLISHED" },
    include: { subject: true, term: true },
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  return (
    <div>
      <PageHeader
        title="Result moderation"
        subtitle="Two checks before a result reaches a student or guardian: an admin or principal moderates, then only a principal publishes."
      />

      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-2 dark:text-slate-400">Step 1 — awaiting moderation</h2>
          <div className="space-y-4">
            {submitted.length === 0 ? (
              <Card>
                <EmptyState title="Nothing waiting for review" />
              </Card>
            ) : (
              submitted.map((a) => {
                const entered = a.marks.filter((m) => m.state === "ENTERED" && m.score != null);
                const avg = entered.length ? entered.reduce((s, m) => s + (m.score ?? 0), 0) / entered.length : null;
                const missing = a.marks.filter((m) => m.state === "BLANK").length;
                return (
                  <Card key={a.id}>
                    <CardHeader
                      title={`${a.subject.name} — ${a.name}`}
                      subtitle={`${a.term.name} · ${a.marks.length} students · avg ${avg != null ? avg.toFixed(1) : "—"} / ${a.maxMark}`}
                      action={
                        <>
                          <Badge tone="brand">Submitted</Badge>
                          {missing > 0 && <Badge tone="amber">{missing} not entered</Badge>}
                        </>
                      }
                    />
                    <ModerateCard assessmentId={a.id} />
                  </Card>
                );
              })
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-500 mb-2 dark:text-slate-400">Step 2 — moderated, awaiting principal publication</h2>
          <div className="space-y-4">
            {approved.length === 0 ? (
              <Card>
                <EmptyState title="Nothing moderated and waiting" />
              </Card>
            ) : (
              approved.map((a) => (
                <Card key={a.id}>
                  <CardHeader
                    title={`${a.subject.name} — ${a.name}`}
                    subtitle={`${a.term.name} · ${a.marks.length} students${a.moderationNote ? ` · Note: ${a.moderationNote}` : ""}`}
                    action={<Badge tone="amber">Moderated</Badge>}
                  />
                  <PublishCard assessmentId={a.id} canPublish={canPublish} />
                </Card>
              ))
            )}
          </div>
        </div>

        <Card>
          <CardHeader title="Recently published" />
          {recentlyPublished.length === 0 ? (
            <EmptyState title="Nothing published yet" />
          ) : (
            <Table head={["Subject", "Assessment", "Term", "Published"]}>
              {recentlyPublished.map((a) => (
                <tr key={a.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{a.subject.name}</td>
                  <td className="py-2.5 px-3">{a.name}</td>
                  <td className="py-2.5 px-3">{a.term.name}</td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{a.publishedAt ? new Date(a.publishedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
