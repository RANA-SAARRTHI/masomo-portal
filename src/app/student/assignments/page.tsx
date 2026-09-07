import { requireSession } from "@/lib/guard";
import { getStudentProfile } from "@/lib/student-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, EmptyState, Badge, Button } from "@/components/ui";
import { submitAssignment } from "@/lib/actions/student";

export default async function StudentAssignmentsPage() {
  const { userId } = await requireSession("/student");
  const profile = await getStudentProfile(userId);
  if (!profile) return null;

  const subjectIds = profile.classGroupId
    ? (await prisma.teacherAllocation.findMany({ where: { classGroupId: profile.classGroupId }, select: { subjectId: true } })).map((a) => a.subjectId)
    : [];

  const assignments = subjectIds.length
    ? await prisma.assignment.findMany({
        where: { subjectId: { in: subjectIds } },
        include: { subject: true, submissions: { where: { studentId: profile.id } } },
        orderBy: { dueDate: "asc" },
      })
    : [];

  return (
    <div>
      <PageHeader title="Assignments" subtitle="Submit your work before the deadline." />
      {assignments.length === 0 ? (
        <Card>
          <EmptyState title="No assignments yet" />
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => {
            const mySubmission = a.submissions[0];
            const overdue = new Date() > a.dueDate;
            return (
              <Card key={a.id}>
                <CardHeader
                  title={a.title}
                  subtitle={`${a.subject.name} · Due ${new Date(a.dueDate).toLocaleDateString()}`}
                  action={
                    mySubmission ? (
                      <Badge tone="emerald">Submitted{mySubmission.late ? " (late)" : ""}</Badge>
                    ) : overdue && !a.allowLate ? (
                      <Badge tone="rose">Closed</Badge>
                    ) : (
                      <Badge tone="amber">Pending</Badge>
                    )
                  }
                />
                <div className="p-4 sm:p-5">
                  <p className="text-sm text-slate-600 mb-3">{a.instructions}</p>
                  {mySubmission ? (
                    <div className="bg-slate-50 rounded-lg p-3 text-sm">
                      <p className="text-slate-700 whitespace-pre-wrap">{mySubmission.text}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        Submitted {new Date(mySubmission.submittedAt).toLocaleString()}
                        {mySubmission.score != null && ` · Score: ${mySubmission.score}`}
                      </p>
                      {mySubmission.feedback && <p className="text-xs text-brand-700 mt-1">Feedback: {mySubmission.feedback}</p>}
                    </div>
                  ) : !overdue || a.allowLate ? (
                    <form action={submitAssignment} className="space-y-2">
                      <input type="hidden" name="assignmentId" value={a.id} />
                      <textarea
                        name="text"
                        required
                        rows={4}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="Type or paste your answer here..."
                      />
                      <Button type="submit">Submit</Button>
                    </form>
                  ) : (
                    <p className="text-sm text-rose-600">The deadline has passed and late submissions are not allowed.</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
