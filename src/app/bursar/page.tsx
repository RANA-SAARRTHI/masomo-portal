import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, Card, CardHeader, Table, Button, Input, Label } from "@/components/ui";
import { createFeeStructure } from "@/lib/actions/bursar";

export default async function BursarOverview() {
  const { tenantId } = await requireSession("/bursar");

  const [feeStructures, invoiced, collected, outstandingInvoices] = await Promise.all([
    prisma.feeStructure.findMany({ where: { tenantId }, orderBy: { id: "desc" } }),
    prisma.invoice.aggregate({ where: { tenantId }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { invoice: { tenantId }, status: "SUCCESSFUL" }, _sum: { amount: true } }),
    prisma.invoice.count({ where: { tenantId, status: { in: ["ISSUED", "PART_PAID"] } } }),
  ]);

  return (
    <div>
      <PageHeader title="Finance overview" subtitle="Fee collection at a glance." />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total invoiced" value={`UGX ${Math.round(invoiced._sum.amount ?? 0).toLocaleString()}`} tone="slate" />
        <StatCard label="Total collected" value={`UGX ${Math.round(collected._sum.amount ?? 0).toLocaleString()}`} tone="brand" />
        <StatCard label="Open invoices" value={outstandingInvoices} tone="amber" />
      </div>

      <Card>
        <CardHeader title="Fee structures" />
        <Table head={["Name", "Amount", "Term", "Mandatory"]}>
          {feeStructures.map((f) => (
            <tr key={f.id}>
              <td className="py-2.5 px-3 font-medium text-slate-900">{f.name}</td>
              <td className="py-2.5 px-3">UGX {Math.round(f.amount).toLocaleString()}</td>
              <td className="py-2.5 px-3">{f.termLabel}</td>
              <td className="py-2.5 px-3">{f.mandatory ? "Yes" : "Optional"}</td>
            </tr>
          ))}
        </Table>
        <form action={createFeeStructure} className="p-4 sm:p-5 border-t border-slate-100 grid sm:grid-cols-4 gap-3 items-end">
          <div>
            <Label>Name</Label>
            <Input name="name" required placeholder="Tuition" />
          </div>
          <div>
            <Label>Amount (UGX)</Label>
            <Input name="amount" type="number" required placeholder="500000" />
          </div>
          <div>
            <Label>Term label</Label>
            <Input name="termLabel" placeholder="Term 1 2026" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="mandatory" defaultChecked className="rounded" /> Mandatory
            </label>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
