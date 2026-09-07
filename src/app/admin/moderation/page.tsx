import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, Badge, Button, Input, EmptyState } from "@/components/ui";
import { approveAndPublishAssessment, sendBackToTeacher } from "@/lib/actions/admin";

export default async function ModerationPage() {
  const { tenantId } = await requireSession("/admin");

  const submitted = await prisma.assessment.findMany({
    where: { subject: { tenantId }, state: "SUBMITTED" },
    include: {
      subject: true,
      term: true,
      marks: true,
    },
    orderBy: { id: "desc" },
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
        subtitle="Review what teachers have submitted before it becomes visible to students and guardians."
      />

      <div className="space-y-4">
        {submitted.length === 0 ? (
          <Card>
            <EmptyState title="Nothing waiting for review" body="Submitted assessments will show up here." />
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
                  action={<Badge tone="brand">Submitted</Badge>}
                />
                <div className="p-4 sm:p-5 flex flex-wrap items-center gap-3">
                  {missing > 0 && <Badge tone="amber">{missing} not entered</Badge>}
                  <form action={approveAndPublishAssessment}>
                    <input type="hidden" name="assessmentId" value={a.id} />
                    <Button type="submit">Approve & publish</Button>
                  </form>
                  <form action={sendBackToTeacher} className="flex gap-2 items-center">
                    <input type="hidden" name="assessmentId" value={a.id} />
                    <Input name="reason" placeholder="Reason for sending back (optional)" className="w-64" />
                    <Button type="submit" variant="secondary">
                      Send back to teacher
                    </Button>
                  </form>
                </div>
              </Card>
            );
          })
        )}

        <Card>
          <CardHeader title="Recently published" />
          {recentlyPublished.length === 0 ? (
            <EmptyState title="Nothing published yet" />
          ) : (
            <Table head={["Subject", "Assessment", "Term", "Published"]}>
              {recentlyPublished.map((a) => (
                <tr key={a.id}>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{a.subject.name}</td>
                  <td className="py-2.5 px-3">{a.name}</td>
                  <td className="py-2.5 px-3">{a.term.name}</td>
                  <td className="py-2.5 px-3 text-slate-500">{a.publishedAt ? new Date(a.publishedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
