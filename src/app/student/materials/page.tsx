import { requireSession } from "@/lib/guard";
import { getStudentProfile } from "@/lib/student-context";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Table, EmptyState, Badge } from "@/components/ui";

export default async function StudentMaterialsPage() {
  const { userId } = await requireSession("/student");
  const profile = await getStudentProfile(userId);
  const materials = profile?.classGroupId
    ? await prisma.contentItem.findMany({ where: { audience: profile.classGroupId }, include: { subject: true }, orderBy: { createdAt: "desc" } })
    : [];

  return (
    <div>
      <PageHeader title="Materials" subtitle="Notes and resources from your teachers." />
      <Card>
        {materials.length === 0 ? (
          <EmptyState title="Nothing posted yet" />
        ) : (
          <Table head={["Title", "Subject", "Type", "Link", "Posted"]}>
            {materials.map((m) => (
              <tr key={m.id}>
                <td className="py-2.5 px-3 font-medium text-slate-900">{m.title}</td>
                <td className="py-2.5 px-3">{m.subject.name}</td>
                <td className="py-2.5 px-3">
                  <Badge>{m.type}</Badge>
                </td>
                <td className="py-2.5 px-3">
                  {m.url ? (
                    <a href={m.url} target="_blank" className="text-brand-700 underline">
                      Open
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2.5 px-3 text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
