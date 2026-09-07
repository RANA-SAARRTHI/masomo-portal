import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, Badge, Button, Select, Input, Label, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { raiseInvoice } from "@/lib/actions/bursar";

export default async function InvoicesPage() {
  const { tenantId } = await requireSession("/bursar");
  const [invoices, students] = await Promise.all([
    prisma.invoice.findMany({ where: { tenantId }, include: { student: { include: { user: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.studentProfile.findMany({ where: { user: { tenantId } }, include: { user: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Invoices" subtitle="Raise and track every charge." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title={`${invoices.length} invoices`} />
          {invoices.length === 0 ? (
            <EmptyState title="No invoices yet" />
          ) : (
            <Table head={["Reference", "Student", "Description", "Amount", "Status"]}>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-2.5 px-3">{inv.reference}</td>
                  <td className="py-2.5 px-3">{inv.student.user.name}</td>
                  <td className="py-2.5 px-3">{inv.description}</td>
                  <td className="py-2.5 px-3">UGX {Math.round(inv.amount).toLocaleString()}</td>
                  <td className="py-2.5 px-3">
                    <Badge tone={inv.status === "PAID" ? "emerald" : inv.status === "PART_PAID" ? "amber" : "rose"}>{inv.status}</Badge>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader title="Raise an invoice" />
          <form action={raiseInvoice} className="p-4 sm:p-5 space-y-3">
            <div>
              <Label htmlFor="field-studentid">Student</Label>
              <Select id="field-studentid" name="studentId" required>
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="field-description">Description</Label>
              <Input id="field-description" name="description" required placeholder="e.g. Term 2 tuition" />
            </div>
            <div>
              <Label htmlFor="field-amount">Amount (UGX)</Label>
              <Input id="field-amount" name="amount" type="number" required placeholder="500000" />
            </div>
            <SubmitButton className="w-full">
              Raise invoice
            </SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
