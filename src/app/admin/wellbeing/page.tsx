import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Badge, Button, Input, Label, Select, EmptyState } from "@/components/ui";
import { createWellbeingRecord, updateWellbeingRecord } from "@/lib/actions/wellbeing";

const CATEGORY_LABEL: Record<string, string> = {
  SAFEGUARDING: "Safeguarding",
  DISCIPLINE: "Discipline",
  HEALTH: "Health",
  COUNSELLING: "Counselling",
};

export default async function WellbeingPage() {
  const { tenantId } = await requireSession("/admin");

  const [records, students] = await Promise.all([
    prisma.wellbeingRecord.findMany({
      where: { tenantId },
      include: { student: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.studentProfile.findMany({ where: { user: { tenantId } }, include: { user: true }, orderBy: { user: { name: "asc" } } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Wellbeing & discipline"
        subtitle="Restricted case records. Only principals and administrators can see this page — ordinary teachers have no access to it at all."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {records.length === 0 ? (
            <Card>
              <EmptyState title="No cases recorded" body="Record a factual observation using the form. This is for tracking action, not diagnosis." />
            </Card>
          ) : (
            records.map((r) => (
              <Card key={r.id}>
                <CardHeader
                  title={r.student.user.name}
                  subtitle={`${CATEGORY_LABEL[r.category] ?? r.category} · Case owner: ${r.caseOwnerName} · ${new Date(r.createdAt).toLocaleDateString()}`}
                  action={<Badge tone={r.status === "RESOLVED" ? "emerald" : r.status === "IN_PROGRESS" ? "amber" : "rose"}>{r.status}</Badge>}
                />
                <div className="p-4 sm:p-5 space-y-3">
                  <p className="text-sm text-slate-700">{r.description}</p>
                  {r.actionTaken && (
                    <p className="text-sm text-slate-500">
                      <span className="font-medium text-slate-700">Action taken:</span> {r.actionTaken}
                    </p>
                  )}
                  {r.status !== "RESOLVED" && (
                    <form action={updateWellbeingRecord} className="flex flex-wrap gap-2 items-end border-t border-slate-100 pt-3">
                      <input type="hidden" name="recordId" value={r.id} />
                      <div className="flex-1 min-w-[10rem]">
                        <Label>Action taken</Label>
                        <Input name="actionTaken" placeholder="What was done" />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select name="status" defaultValue={r.status}>
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="RESOLVED">Resolved</option>
                        </Select>
                      </div>
                      <Button type="submit" variant="secondary">
                        Update
                      </Button>
                    </form>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        <Card className="h-fit">
          <CardHeader title="Record a concern" />
          <form action={createWellbeingRecord} className="p-4 sm:p-5 space-y-3">
            <div>
              <Label>Student</Label>
              <Select name="studentId" required>
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select name="category" required>
                <option value="SAFEGUARDING">Safeguarding</option>
                <option value="DISCIPLINE">Discipline</option>
                <option value="HEALTH">Health</option>
                <option value="COUNSELLING">Counselling</option>
              </Select>
            </div>
            <div>
              <Label>Factual observation</Label>
              <textarea
                name="description"
                required
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Record what was observed, not a diagnosis or judgement."
              />
            </div>
            <Button type="submit" className="w-full">
              Record
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
