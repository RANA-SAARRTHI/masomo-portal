import { requireSession } from "@/lib/guard";
import { getTeacherAllocations } from "@/lib/teacher-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, Select, Input, Button, Label, EmptyState, Badge } from "@/components/ui";
import { postAssignment, gradeSubmission } from "@/lib/actions/teacher";

export default async function AssignmentsPage() {
  const { userId } = await requireSession("/teacher");
  const staff = await getTeacherAllocations(userId);
  const allocations = staff?.allocations ?? [];
  const subjectIds = allocations.map((a) => a.subject.id);

  const assignments = subjectIds.length
    ? await prisma.assignment.findMany({
        where: { subjectId: { in: subjectIds } },
        include: { subject: true, submissions: { include: { student: { include: { user: true } } } } },
        orderBy: { dueDate: "desc" },
      })
    : [];

  return (
    <div>
      <PageHeader title="Assignments" subtitle="Set work, then review and grade submissions." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {assignments.length === 0 ? (
            <Card>
              <EmptyState title="No assignments yet" />
            </Card>
          ) : (
            assignments.map((a) => (
              <Card key={a.id}>
                <CardHeader
                  title={a.title}
                  subtitle={`${a.subject.name} · Due ${new Date(a.dueDate).toLocaleDateString()} · ${a.submissions.length} submitted`}
                />
                {a.submissions.length > 0 && (
                  <Table head={["Student", "Submitted", "Score", "Feedback"]}>
                    {a.submissions.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{s.student.user.name}</td>
                        <td className="py-2.5 px-3">
                          {new Date(s.submittedAt).toLocaleString()} {s.late && <Badge tone="amber">Late</Badge>}
                        </td>
                        <td className="py-2.5 px-3" colSpan={2}>
                          <form action={gradeSubmission} className="flex gap-2 items-center">
                            <input type="hidden" name="submissionId" value={s.id} />
                            <Input name="score" type="number" defaultValue={s.score ?? ""} className="w-20" placeholder="Score" />
                            <Input name="feedback" defaultValue={s.feedback ?? ""} placeholder="Feedback" className="w-40" />
                            <Button type="submit" variant="secondary">
                              Save
                            </Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </Table>
                )}
              </Card>
            ))
          )}
        </div>

        <Card className="h-fit">
          <CardHeader title="Set an assignment" />
          <form action={postAssignment} className="p-4 sm:p-5 space-y-3">
            <div>
              <Label>Subject & class</Label>
              <Select name="combo" required>
                <option value="">Select</option>
                {allocations.map((a) => (
                  <option key={a.id} value={`${a.subject.id}|${a.classGroup.id}`}>
                    {a.subject.name} — {a.classGroup.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input name="title" required placeholder="e.g. Essay: causes of..." />
            </div>
            <div>
              <Label>Instructions</Label>
              <Input name="instructions" placeholder="What should students do?" />
            </div>
            <div>
              <Label>Due date</Label>
              <Input type="date" name="dueDate" required />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input type="checkbox" name="allowLate" className="rounded" /> Allow late submission
            </label>
            <Button type="submit" className="w-full">
              Post assignment
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
