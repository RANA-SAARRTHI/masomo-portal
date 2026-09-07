"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";

export async function addLibraryItem(formData: FormData) {
  const { tenantId } = await requireSession("/library");
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const copies = Number(formData.get("copies") ?? 1);
  if (!title) return;
  await prisma.libraryItem.create({ data: { tenantId, title, author, copies, copiesAvailable: copies } });
  revalidatePath("/library");
}

export async function issueItem(formData: FormData) {
  const { tenantId } = await requireSession("/library");
  const itemId = String(formData.get("itemId") ?? "");
  const borrowerName = String(formData.get("borrowerName") ?? "").trim();
  const days = Number(formData.get("days") ?? 14);
  if (!itemId || !borrowerName) return;
  const item = await prisma.libraryItem.findFirst({ where: { id: itemId, tenantId } });
  if (!item) throw new Error("Not found.");
  // The Issue button is already disabled client-side once copies run out, so
  // reaching this is a race (two people issuing the last copy at once) or a
  // stale page — either way, say so instead of silently doing nothing.
  if (item.copiesAvailable < 1) throw new Error("No copies of this title are currently available.");
  await prisma.$transaction([
    prisma.libraryLoan.create({
      data: { itemId, borrowerName, dueAt: new Date(Date.now() + days * 86400000) },
    }),
    prisma.libraryItem.update({ where: { id: itemId }, data: { copiesAvailable: { decrement: 1 } } }),
  ]);
  revalidatePath("/library");
}

export async function returnItem(formData: FormData) {
  const { tenantId } = await requireSession("/library");
  const loanId = String(formData.get("loanId") ?? "");
  if (!loanId) return;
  const loan = await prisma.libraryLoan.findFirst({ where: { id: loanId, item: { tenantId } } });
  if (!loan) throw new Error("Not found.");
  await prisma.libraryLoan.update({ where: { id: loanId }, data: { returnedAt: new Date() } });
  await prisma.libraryItem.update({ where: { id: loan.itemId }, data: { copiesAvailable: { increment: 1 } } });
  revalidatePath("/library");
}
