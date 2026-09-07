import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, Button, Input, Label, EmptyState } from "@/components/ui";
import { addLibraryItem, issueItem, returnItem } from "@/lib/actions/library";

export default async function LibraryPage() {
  const { tenantId } = await requireSession("/library");
  const items = await prisma.libraryItem.findMany({
    where: { tenantId },
    include: { loans: { where: { returnedAt: null } } },
    orderBy: { title: "asc" },
  });
  const activeLoans = await prisma.libraryLoan.findMany({
    where: { item: { tenantId }, returnedAt: null },
    include: { item: true },
    orderBy: { dueAt: "asc" },
  });

  return (
    <div>
      <PageHeader title="Library" subtitle="Catalogue, loans and returns." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={`${items.length} titles`} />
            {items.length === 0 ? (
              <EmptyState title="Catalogue is empty" />
            ) : (
              <Table head={["Title", "Author", "Available", "Issue"]}>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{it.title}</td>
                    <td className="py-2.5 px-3">{it.author}</td>
                    <td className="py-2.5 px-3">
                      {it.copiesAvailable}/{it.copies}
                    </td>
                    <td className="py-2.5 px-3">
                      <form action={issueItem} className="flex gap-1">
                        <input type="hidden" name="itemId" value={it.id} />
                        <Input name="borrowerName" placeholder="Borrower" className="w-28" />
                        <Button type="submit" variant="secondary" disabled={it.copiesAvailable < 1}>
                          Issue
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader title="Active loans" />
            {activeLoans.length === 0 ? (
              <EmptyState title="No items on loan" />
            ) : (
              <Table head={["Item", "Borrower", "Due", ""]}>
                {activeLoans.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2.5 px-3">{l.item.title}</td>
                    <td className="py-2.5 px-3">{l.borrowerName}</td>
                    <td className="py-2.5 px-3">{new Date(l.dueAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3">
                      <form action={returnItem}>
                        <input type="hidden" name="loanId" value={l.id} />
                        <button className="text-xs text-brand-700 underline" type="submit">
                          Mark returned
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Add a title" />
          <form action={addLibraryItem} className="p-4 sm:p-5 space-y-3">
            <div>
              <Label>Title</Label>
              <Input name="title" required />
            </div>
            <div>
              <Label>Author</Label>
              <Input name="author" />
            </div>
            <div>
              <Label>Copies</Label>
              <Input name="copies" type="number" defaultValue={1} />
            </div>
            <Button type="submit" className="w-full">
              Add
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
