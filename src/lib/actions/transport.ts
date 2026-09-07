"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";

export async function addRoute(formData: FormData) {
  const { tenantId } = await requireSession("/transport");
  const name = String(formData.get("name") ?? "").trim();
  const vehicle = String(formData.get("vehicle") ?? "").trim();
  const driver = String(formData.get("driver") ?? "").trim();
  const capacity = Number(formData.get("capacity") ?? 30);
  if (!name) return;
  await prisma.transportRoute.create({ data: { tenantId, name, vehicle, driver, capacity } });
  revalidatePath("/transport");
}

export async function assignStudent(formData: FormData) {
  const { tenantId } = await requireSession("/transport");
  const routeId = String(formData.get("routeId") ?? "");
  const studentName = String(formData.get("studentName") ?? "").trim();
  const stop = String(formData.get("stop") ?? "").trim();
  if (!routeId || !studentName) return;
  const route = await prisma.transportRoute.findFirst({ where: { id: routeId, tenantId } });
  if (!route) throw new Error("Route not found.");
  await prisma.transportAssignment.create({ data: { routeId, studentName, stop } });
  revalidatePath("/transport");
}
