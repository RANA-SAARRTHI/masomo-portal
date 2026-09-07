"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

// Returns teachers at this school who are free at the slot's day/time and
// are not the teacher already assigned to it — used to populate the
// substitute picker with only people who can actually cover the period.
export async function getEligibleSubstitutes(timetableSlotId: string) {
  const { tenantId } = await requireSession("/admin");
  const slot = await prisma.timetableSlot.findFirst({ where: { id: timetableSlotId, classGroup: { tenantId } } });
  if (!slot) throw new Error("Not found.");

  const originalAllocation = await prisma.teacherAllocation.findFirst({
    where: { subjectId: slot.subjectId, classGroupId: slot.classGroupId },
    include: { teacher: { include: { user: true } } },
  });

  const allTeachers = await prisma.staffProfile.findMany({
    where: { user: { tenantId, role: "TEACHER", status: "ACTIVE" } },
    include: { user: true, allocations: true },
  });

  const busyTeacherIds = new Set<string>();
  const allocationPairs = await prisma.teacherAllocation.findMany({
    where: { teacherId: { in: allTeachers.map((t) => t.id) } },
  });
  const pairKey = (subjectId: string, classGroupId: string) => `${subjectId}|${classGroupId}`;
  const teacherPairs = new Map<string, string[]>(); // teacherId -> pairKeys
  for (const a of allocationPairs) {
    const list = teacherPairs.get(a.teacherId) ?? [];
    list.push(pairKey(a.subjectId, a.classGroupId));
    teacherPairs.set(a.teacherId, list);
  }

  const sameDaySlots = await prisma.timetableSlot.findMany({ where: { dayOfWeek: slot.dayOfWeek } });

  for (const [teacherId, pairs] of teacherPairs) {
    const clash = sameDaySlots.some(
      (s) => pairs.includes(pairKey(s.subjectId, s.classGroupId)) && timesOverlap(slot.startTime, slot.endTime, s.startTime, s.endTime)
    );
    if (clash) busyTeacherIds.add(teacherId);
  }

  return allTeachers
    .filter((t) => t.id !== originalAllocation?.teacherId && !busyTeacherIds.has(t.id))
    .map((t) => ({ id: t.id, name: t.user.name }));
}

export async function assignSubstitute(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const timetableSlotId = String(formData.get("timetableSlotId") ?? "");
  const date = String(formData.get("date") ?? "");
  const substituteTeacherId = String(formData.get("substituteTeacherId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!timetableSlotId || !date || !substituteTeacherId) throw new Error("All fields are required.");

  const slot = await prisma.timetableSlot.findFirst({ where: { id: timetableSlotId, classGroup: { tenantId } } });
  if (!slot) throw new Error("Not found.");
  const chosenDate = new Date(date + "T00:00:00");
  // JS getDay(): 0=Sun..6=Sat. Our dayOfWeek: 1=Mon..7=Sun.
  const jsDay = chosenDate.getDay();
  const ourDay = jsDay === 0 ? 7 : jsDay;
  if (ourDay !== slot.dayOfWeek) {
    throw new Error("That date doesn't fall on this period's scheduled day of the week.");
  }

  const originalAllocation = await prisma.teacherAllocation.findFirst({
    where: { subjectId: slot.subjectId, classGroupId: slot.classGroupId },
  });
  if (!originalAllocation) throw new Error("No teacher is currently allocated to this period.");

  const eligible = await getEligibleSubstitutes(timetableSlotId);
  if (!eligible.some((t) => t.id === substituteTeacherId)) {
    throw new Error("That teacher is not free at this time — pick someone from the eligible list.");
  }

  await prisma.substitution.upsert({
    where: { timetableSlotId_date: { timetableSlotId, date: chosenDate } },
    update: { substituteTeacherId, reason: reason || null, originalTeacherId: originalAllocation.teacherId, createdById: userId },
    create: {
      timetableSlotId,
      date: chosenDate,
      originalTeacherId: originalAllocation.teacherId,
      substituteTeacherId,
      reason: reason || null,
      createdById: userId,
    },
  });

  await prisma.auditLog.create({
    data: { tenantId, actorId: userId, action: "ASSIGN_SUBSTITUTE", target: timetableSlotId },
  });

  revalidatePath("/admin/substitutions");
  revalidatePath("/teacher");
}

export async function cancelSubstitution(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const substitutionId = String(formData.get("substitutionId") ?? "");
  if (!substitutionId) return;
  const existing = await prisma.substitution.findFirst({ where: { id: substitutionId, timetableSlot: { classGroup: { tenantId } } } });
  if (!existing) throw new Error("Not found.");
  await prisma.substitution.delete({ where: { id: substitutionId } });
  await prisma.auditLog.create({ data: { tenantId, actorId: userId, action: "CANCEL_SUBSTITUTION", target: substitutionId } });
  revalidatePath("/admin/substitutions");
  revalidatePath("/teacher");
}
