import { requireSession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, CardHeader, Table, Badge, Button, Select, Input, Label, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { recordPayment, reversePayment } from "@/lib/actions/bursar";

export default async function PaymentsPage() {
  const { tenantId } = await requireSession("/bursar");
  const [payments, openInvoices] = await Promise.all([
    prisma.payment.findMany({
      where: { invoice: { tenantId } },
      include: { invoice: { include: { student: { include: { user: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.invoice.findMany({
      where: { tenantId, status: { in: ["ISSUED", "PART_PAID"] } },
      include: { student: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Payments" subtitle="Record cash, bank or mobile money payments against an invoice." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent payments" />
          {payments.length === 0 ? (
            <EmptyState title="No payments recorded yet" />
          ) : (
            <Table head={["Receipt", "Student", "Amount", "Method", "Status", ""]}>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 px-3">{p.reference}</td>
                  <td className="py-2.5 px-3">{p.invoice.student.user.name}</td>
                  <td className="py-2.5 px-3">UGX {Math.round(p.amount).toLocaleString()}</td>
                  <td className="py-2.5 px-3">{p.method.replace("_", " ")}</td>
                  <td className="py-2.5 px-3">
                    <Badge tone={p.status === "SUCCESSFUL" ? "emerald" : "rose"}>{p.status}</Badge>
                  </td>
                  <td className="py-2.5 px-3">
                    {p.status === "SUCCESSFUL" && (
                      <form action={reversePayment}>
                        <input type="hidden" name="paymentId" value={p.id} />
                        <button className="text-xs text-rose-600 underline" type="submit">
                          Reverse
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card className="h-fit">
          <CardHeader title="Record payment" />
          <form action={recordPayment} className="p-4 sm:p-5 space-y-3">
            <div>
              <Label htmlFor="field-invoiceid">Invoice</Label>
              <Select id="field-invoiceid" name="invoiceId" required>
                <option value="">Select open invoice</option>
                {openInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.student.user.name} — {inv.reference} (UGX {Math.round(inv.amount).toLocaleString()})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="field-amount">Amount (UGX)</Label>
              <Input id="field-amount" name="amount" type="number" required />
            </div>
            <div>
              <Label htmlFor="field-method">Method</Label>
              <Select id="field-method" name="method" defaultValue="CASH">
                <option value="CASH">Cash</option>
                <option value="BANK">Bank</option>
                <option value="MOBILE_MONEY">Mobile money</option>
              </Select>
            </div>
            <SubmitButton className="w-full">
              Record payment
            </SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
