"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAnySession, requireSession } from "@/lib/guard";

export async function submitLeaveRequest(formData: FormData) {
  const { tenantId, userId } = await requireAnySession();
  const staff = await prisma.staffProfile.findUnique({ where: { userId } });
  if (!staff) throw new Error("Only staff members can request leave.");

  const category = String(formData.get("category") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!category || !startDate || !endDate) throw new Error("All fields except reason are required.");
  if (startDate > endDate) throw new Error("Start date must be on or before the end date.");

  await prisma.leaveRequest.create({
    data: {
      tenantId,
      staffId: staff.id,
      category,
      startDate: new Date(startDate + "T00:00:00"),
      endDate: new Date(endDate + "T00:00:00"),
      reason: reason || null,
    },
  });
  await prisma.auditLog.create({ data: { tenantId, actorId: userId, action: "SUBMIT_LEAVE_REQUEST" } });
  revalidatePath("/account/leave");
  revalidatePath("/admin/leave");
}

export async function decideLeaveRequest(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const leaveRequestId = String(formData.get("leaveRequestId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const decisionNote = String(formData.get("decisionNote") ?? "").trim();
  if (!leaveRequestId || (decision !== "APPROVED" && decision !== "DECLINED")) {
    throw new Error("Invalid decision.");
  }

  const request = await prisma.leaveRequest.findUniqueOrThrow({ where: { id: leaveRequestId } });
  if (request.tenantId !== tenantId) throw new Error("Not found.");
  if (request.status !== "PENDING") throw new Error("This request has already been decided.");

  await prisma.leaveRequest.update({
    where: { id: leaveRequestId },
    data: { status: decision, decidedById: userId, decisionNote: decisionNote || null, decidedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: { tenantId, actorId: userId, action: `LEAVE_REQUEST_${decision}`, target: leaveRequestId },
  });
  revalidatePath("/admin/leave");
  revalidatePath("/account/leave");
}
