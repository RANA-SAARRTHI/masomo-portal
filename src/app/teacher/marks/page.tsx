import { requireSession } from "@/lib/guard";
import { getTeacherAllocations } from "@/lib/teacher-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Select, Input, Button, Label, EmptyState, Badge } from "@/components/ui";
import { createAssessment, saveMarks, submitForModeration } from "@/lib/actions/teacher";

const STATE_TONE: Record<string, "emerald" | "amber" | "slate" | "rose" | "brand"> = {
  OPEN: "amber",
  SUBMITTED: "brand",
  MODERATION: "brand",
  APPROVED: "brand",
  PUBLISHED: "emerald",
};

export default async function MarksPage({ searchParams }: { searchParams: Promise<{ assessmentId?: string }> }) {
  const { userId, tenantId } = await requireSession("/teacher");
  const sp = await searchParams;
  const staff = await getTeacherAllocations(userId);
  const allocations = staff?.allocations ?? [];
  const subjectIds = allocations.map((a) => a.subject.id);

  const [terms, assessments] = await Promise.all([
    prisma.term.findMany({ where: { academicYear: { tenantId } }, orderBy: { startDate: "desc" } }),
    subjectIds.length
      ? prisma.assessment.findMany({ where: { subjectId: { in: subjectIds } }, include: { subject: true, term: true }, orderBy: { id: "desc" } })
      : Promise.resolve([]),
  ]);

  const activeId = sp.assessmentId ?? assessments[0]?.id;
  const active = assessments.find((a) => a.id === activeId);
  const activeAllocation = active ? allocations.find((a) => a.subject.id === active.subjectId) : undefined;

  const students = activeAllocation
    ? await prisma.studentProfile.findMany({ where: { classGroupId: activeAllocation.classGroup.id }, include: { user: true } })
    : [];
  const marks = active ? await prisma.markEntry.findMany({ where: { assessmentId: active.id } }) : [];
  const marksMap = new Map(marks.map((m) => [m.studentId, m]));

  return (
    <div>
      <PageHeader title="Marks" subtitle="Enter marks, then submit for moderation. A principal or delegated approver publishes." />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Assessments"
            action={
              <form method="get">
                <Select name="assessmentId" defaultValue={activeId} onChange={undefined}>
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.subject.name} — {a.name} ({a.term.name})
                    </option>
                  ))}
                </Select>
              </form>
            }
          />

          {!active ? (
            <EmptyState title="No assessment selected" body="Create one using the form on the right." />
          ) : (
            <>
              <div className="px-4 sm:px-5 pt-4 flex items-center gap-2">
                <Badge tone={STATE_TONE[active.state] ?? "slate"}>{active.state}</Badge>
                <span className="text-sm text-slate-500">Max mark: {active.maxMark}</span>
                {active.state === "OPEN" && (
                  <form action={submitForModeration} className="ml-auto">
                    <input type="hidden" name="assessmentId" value={active.id} />
                    <Button type="submit" variant="secondary">
                      Submit for moderation
                    </Button>
                  </form>
                )}
                {active.state !== "OPEN" && (
                  <span className="ml-auto text-xs text-slate-400">
                    {active.state === "PUBLISHED" ? "Published — visible to students and guardians." : "Awaiting review before publication."}
                  </span>
                )}
              </div>
              <form action={saveMarks} className="p-4 sm:p-5 space-y-2">
                <input type="hidden" name="assessmentId" value={active.id} />
                {students.map((s) => {
                  const m = marksMap.get(s.id);
                  return (
                    <div key={s.id} className="flex items-center gap-3 border-b border-slate-50 pb-2 last:border-0">
                      <input type="hidden" name="studentId" value={s.id} />
                      <span className="flex-1 text-sm font-medium text-slate-800">{s.user.name}</span>
                      <Select name={`state-${s.id}`} defaultValue={m?.state ?? "ENTERED"} className="w-32" disabled={active.state !== "OPEN"}>
                        <option value="ENTERED">Score</option>
                        <option value="ABSENT">Absent</option>
                        <option value="EXEMPT">Exempt</option>
                        <option value="BLANK">Not entered</option>
                      </Select>
                      <Input
                        name={`score-${s.id}`}
                        type="number"
                        step="0.5"
                        defaultValue={m?.score ?? ""}
                        className="w-24"
                        placeholder="0"
                        disabled={active.state !== "OPEN"}
                      />
                    </div>
                  );
                })}
                <Button type="submit" disabled={active.state !== "OPEN"}>
                  Save marks
                </Button>
              </form>
            </>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader title="New assessment" />
          <form action={createAssessment} className="p-4 sm:p-5 space-y-3">
            <div>
              <Label>Subject</Label>
              <Select name="subjectId" required>
                {Array.from(new Map(allocations.map((a) => [a.subject.id, a.subject])).values()).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Term</Label>
              <Select name="termId" required>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Name</Label>
              <Input name="name" required placeholder="e.g. Midterm" />
            </div>
            <div>
              <Label>Max mark</Label>
              <Input name="maxMark" type="number" defaultValue={100} />
            </div>
            <Button type="submit" className="w-full">
              Create
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
