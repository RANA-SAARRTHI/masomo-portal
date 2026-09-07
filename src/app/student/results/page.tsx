import Link from "next/link";
import { requireSession } from "@/lib/guard";
import { getStudentProfile } from "@/lib/student-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Table, EmptyState, Button } from "@/components/ui";

export default async function StudentResultsPage() {
  const { userId } = await requireSession("/student");
  const profile = await getStudentProfile(userId);
  if (!profile) return null;

  const marks = await prisma.markEntry.findMany({
    where: { studentId: profile.id, assessment: { state: "PUBLISHED" } },
    include: { assessment: { include: { subject: true, term: true } } },
    orderBy: { assessment: { term: { startDate: "desc" } } },
  });

  return (
    <div>
      <PageHeader
        title="Results"
        subtitle="Only published, approved results appear here."
        action={
          <Link href="/report-card">
            <Button variant="secondary">View printable report card</Button>
          </Link>
        }
      />
      <Card>
        {marks.length === 0 ? (
          <EmptyState title="No published results yet" body="Your results will appear here once approved by your teachers." />
        ) : (
          <Table head={["Subject", "Assessment", "Term", "Score", "State"]}>
            {marks.map((m) => (
              <tr key={m.id}>
                <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{m.assessment.subject.name}</td>
                <td className="py-2.5 px-3">{m.assessment.name}</td>
                <td className="py-2.5 px-3">{m.assessment.term.name}</td>
                <td className="py-2.5 px-3">
                  {m.state === "ENTERED" ? `${m.score ?? "-"} / ${m.assessment.maxMark}` : m.state}
                </td>
                <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{m.state}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
