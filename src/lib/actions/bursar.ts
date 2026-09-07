"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";

function genReference(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
}

export async function createFeeStructure(formData: FormData) {
  const { tenantId } = await requireSession("/bursar");
  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const termLabel = String(formData.get("termLabel") ?? "").trim();
  const mandatory = formData.get("mandatory") === "on";
  if (!name || !amount) return;
  await prisma.feeStructure.create({ data: { tenantId, name, amount, termLabel, mandatory } });
  revalidatePath("/bursar");
}

export async function raiseInvoice(formData: FormData) {
  const { tenantId } = await requireSession("/bursar");
  const studentId = String(formData.get("studentId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  if (!studentId || !description || !amount) return;

  await prisma.invoice.create({
    data: { tenantId, studentId, description, amount, reference: genReference("INV"), status: "ISSUED" },
  });
  revalidatePath("/bursar/invoices");
}

export async function recordPayment(formData: FormData) {
  const { tenantId } = await requireSession("/bursar");
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "CASH");
  if (!invoiceId || !amount) return;

  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId }, include: { payments: true } });
  if (!invoice) throw new Error("Invoice not found.");
  await prisma.payment.create({
    data: { invoiceId, amount, method, status: "SUCCESSFUL", reference: genReference("RCT") },
  });

  const totalPaid = invoice.payments.filter((p) => p.status === "SUCCESSFUL").reduce((s, p) => s + p.amount, 0) + amount;
  const status = totalPaid >= invoice.amount ? "PAID" : "PART_PAID";
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status } });

  revalidatePath("/bursar/payments");
  revalidatePath("/bursar/invoices");
}

export async function reversePayment(formData: FormData) {
  const { tenantId } = await requireSession("/bursar");
  const paymentId = String(formData.get("paymentId") ?? "");
  const reason = String(formData.get("reason") ?? "Reversed by bursar");
  if (!paymentId) return;

  const existing = await prisma.payment.findFirst({ where: { id: paymentId, invoice: { tenantId } } });
  if (!existing) throw new Error("Payment not found.");

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "REVERSED", reversedAt: new Date(), reversalReason: reason },
  });

  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: payment.invoiceId }, include: { payments: true } });
  const totalPaid = invoice.payments.filter((p) => p.status === "SUCCESSFUL").reduce((s, p) => s + p.amount, 0);
  const status = totalPaid <= 0 ? "ISSUED" : totalPaid >= invoice.amount ? "PAID" : "PART_PAID";
  await prisma.invoice.update({ where: { id: invoice.id }, data: { status } });

  revalidatePath("/bursar/payments");
  revalidatePath("/bursar/invoices");
}
