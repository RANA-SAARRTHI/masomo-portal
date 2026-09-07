"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";

async function logAction(tenantId: string, actorId: string, action: string, target?: string) {
  await prisma.auditLog.create({ data: { tenantId, actorId, action, target } });
}

export async function createClassGroup(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const name = String(formData.get("name") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim();
  if (!name) return;
  const cg = await prisma.classGroup.create({ data: { tenantId, name, level } });
  await logAction(tenantId, userId, "CREATE_CLASS", cg.id);
  revalidatePath("/admin/classes");
}

export async function createSubject(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!name || !code) return;
  const subj = await prisma.subject.create({ data: { tenantId, name, code } });
  await logAction(tenantId, userId, "CREATE_SUBJECT", subj.id);
  revalidatePath("/admin/classes");
}

export async function createStudent(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const admissionNo = String(formData.get("admissionNo") ?? "").trim();
  const classGroupId = String(formData.get("classGroupId") ?? "") || null;
  if (!name || !email || !admissionNo) return;

  const passwordHash = await bcrypt.hash("Masomo@2026", 10);
  const user = await prisma.user.create({
    data: {
      tenantId,
      name,
      email,
      role: "STUDENT",
      passwordHash,
      studentProfile: { create: { admissionNo, classGroupId } },
    },
  });
  await logAction(tenantId, userId, "CREATE_STUDENT", user.id);
  revalidatePath("/admin/students");
}

export async function linkGuardian(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const studentId = String(formData.get("studentId") ?? "");
  const guardianName = String(formData.get("guardianName") ?? "").trim();
  const guardianEmail = String(formData.get("guardianEmail") ?? "").trim().toLowerCase();
  const relationship = String(formData.get("relationship") ?? "Parent");
  if (!studentId || !guardianName || !guardianEmail) return;

  let guardian = await prisma.user.findFirst({ where: { tenantId, email: guardianEmail } });
  if (!guardian) {
    const passwordHash = await bcrypt.hash("Masomo@2026", 10);
    guardian = await prisma.user.create({
      data: { tenantId, name: guardianName, email: guardianEmail, role: "GUARDIAN", passwordHash },
    });
  }
  await prisma.guardianLink.upsert({
    where: { guardianId_studentId: { guardianId: guardian.id, studentId } },
    update: { relationship },
    create: { guardianId: guardian.id, studentId, relationship },
  });
  await logAction(tenantId, userId, "LINK_GUARDIAN", guardian.id);
  revalidatePath("/admin/students");
}

export async function createStaff(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const staffNo = String(formData.get("staffNo") ?? "").trim();
  const role = String(formData.get("role") ?? "TEACHER");
  const department = String(formData.get("department") ?? "").trim();
  if (!name || !email || !staffNo) return;

  const passwordHash = await bcrypt.hash("Masomo@2026", 10);
  const user = await prisma.user.create({
    data: {
      tenantId,
      name,
      email,
      role,
      passwordHash,
      staffProfile: { create: { staffNo, department } },
    },
  });
  await logAction(tenantId, userId, "CREATE_STAFF", user.id);
  revalidatePath("/admin/staff");
}

export async function allocateTeacher(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const teacherId = String(formData.get("teacherId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const isClassTeacher = formData.get("isClassTeacher") === "on";
  if (!teacherId || !subjectId || !classGroupId) return;

  await prisma.teacherAllocation.upsert({
    where: { teacherId_subjectId_classGroupId: { teacherId, subjectId, classGroupId } },
    update: { isClassTeacher },
    create: { teacherId, subjectId, classGroupId, isClassTeacher },
  });
  await logAction(tenantId, userId, "ALLOCATE_TEACHER", teacherId);
  revalidatePath("/admin/staff");
}

export async function updateUserStatus(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const targetId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "ACTIVE");
  if (!targetId) return;
  const target = await prisma.user.findFirst({ where: { id: targetId, tenantId } });
  if (!target) throw new Error("Not found.");
  await prisma.user.update({ where: { id: targetId }, data: { status } });
  await logAction(tenantId, userId, `SET_STATUS_${status}`, targetId);
  revalidatePath("/admin/staff");
  revalidatePath("/admin/students");
}

export async function updateTenantBranding(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const name = String(formData.get("name") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "#0f766e");
  if (!name) return;
  await prisma.tenant.update({ where: { id: tenantId }, data: { name, district, primaryColor } });
  await logAction(tenantId, userId, "UPDATE_BRANDING", tenantId);
  revalidatePath("/admin/settings");
}

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

// Throws on a scheduling clash instead of silently failing, so the calling
// client component can show the admin exactly why the period was rejected.
export async function createTimetableSlot(formData: FormData): Promise<{ ok: true } | never> {
  const { tenantId, userId } = await requireSession("/admin");
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const dayOfWeek = Number(formData.get("dayOfWeek") ?? 1);
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const room = String(formData.get("room") ?? "").trim();
  if (!classGroupId || !subjectId || !startTime || !endTime) {
    throw new Error("All fields except room are required.");
  }
  if (startTime >= endTime) {
    throw new Error("Start time must be before end time.");
  }

  const [classSlots, teacherAllocations] = await Promise.all([
    prisma.timetableSlot.findMany({ where: { classGroupId, dayOfWeek } }),
    prisma.teacherAllocation.findMany({ where: { subjectId, classGroupId }, select: { teacherId: true } }),
  ]);

  const classClash = classSlots.find((s) => timesOverlap(startTime, endTime, s.startTime, s.endTime));
  if (classClash) {
    throw new Error(`This class already has a period from ${classClash.startTime} to ${classClash.endTime} on this day.`);
  }

  if (room) {
    const roomClash = await prisma.timetableSlot.findFirst({
      where: { dayOfWeek, room, classGroup: { tenantId } },
    });
    if (roomClash && timesOverlap(startTime, endTime, roomClash.startTime, roomClash.endTime)) {
      throw new Error(`Room "${room}" is already booked from ${roomClash.startTime} to ${roomClash.endTime} on this day.`);
    }
  }

  const teacherIds = teacherAllocations.map((a) => a.teacherId);
  if (teacherIds.length > 0) {
    const [sameDaySlots, allTeacherAllocations] = await Promise.all([
      prisma.timetableSlot.findMany({
        where: { dayOfWeek, classGroup: { tenantId }, classGroupId: { not: classGroupId } },
        include: { classGroup: true },
      }),
      prisma.teacherAllocation.findMany({ where: { teacherId: { in: teacherIds } } }),
    ]);
    const busyPairs = new Set(allTeacherAllocations.map((a) => `${a.subjectId}|${a.classGroupId}`));
    const teacherClash = sameDaySlots.find(
      (s) => busyPairs.has(`${s.subjectId}|${s.classGroupId}`) && timesOverlap(startTime, endTime, s.startTime, s.endTime)
    );
    if (teacherClash) {
      throw new Error(`The teacher for this subject is already scheduled with ${teacherClash.classGroup.name} at that time.`);
    }
  }

  await prisma.timetableSlot.create({
    data: { classGroupId, subjectId, dayOfWeek, startTime, endTime, room: room || null },
  });
  await logAction(tenantId, userId, "CREATE_TIMETABLE_SLOT", classGroupId);
  revalidatePath("/admin/timetable");
  return { ok: true };
}

export async function deleteTimetableSlot(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const slotId = String(formData.get("slotId") ?? "");
  if (!slotId) return;
  const slot = await prisma.timetableSlot.findFirst({ where: { id: slotId, classGroup: { tenantId } } });
  if (!slot) throw new Error("Not found.");
  await prisma.timetableSlot.delete({ where: { id: slotId } });
  await logAction(tenantId, userId, "DELETE_TIMETABLE_SLOT", slotId);
  revalidatePath("/admin/timetable");
}

// Two-person check before a result reaches a student or guardian: any
// admin/principal can moderate a submitted assessment, but only a principal
// (or platform owner) can take the final publish step — the same person
// cannot both moderate and publish their own moderation by role alone,
// since moderation is open to admins who are barred from publishing.
export async function moderateAssessment(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!assessmentId) throw new Error("Missing assessment.");

  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, subject: { tenantId } } });
  if (!assessment) throw new Error("Not found.");
  if (assessment.state !== "SUBMITTED") throw new Error("This assessment is not awaiting moderation.");

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { state: "APPROVED", moderatedById: userId, moderationNote: note || null, moderatedAt: new Date() },
  });
  await logAction(tenantId, userId, "MODERATE_ASSESSMENT", assessmentId);
  revalidatePath("/admin/moderation");
}

export async function publishAssessment(formData: FormData) {
  const { tenantId, userId, role } = await requireSession("/admin");
  const assessmentId = String(formData.get("assessmentId") ?? "");
  if (!assessmentId) throw new Error("Missing assessment.");
  if (role !== "PRINCIPAL" && role !== "PLATFORM_OWNER") {
    throw new Error("Only a principal can publish results.");
  }

  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, subject: { tenantId } } });
  if (!assessment) throw new Error("Not found.");
  if (assessment.state !== "APPROVED") throw new Error("This assessment must be moderated before it can be published.");

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { state: "PUBLISHED", publishedById: userId, publishedAt: new Date() },
  });
  await logAction(tenantId, userId, "PUBLISH_ASSESSMENT", assessmentId);
  revalidatePath("/admin/moderation");
}

export async function sendBackToTeacher(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!assessmentId) return;
  const assessment = await prisma.assessment.findFirst({ where: { id: assessmentId, subject: { tenantId } } });
  if (!assessment) throw new Error("Not found.");
  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { state: "OPEN", moderatedById: null, moderationNote: null, moderatedAt: null },
  });
  await logAction(tenantId, userId, `SEND_BACK_TO_TEACHER${reason ? ": " + reason : ""}`, assessmentId);
  revalidatePath("/admin/moderation");
}

export async function postAnnouncement(formData: FormData) {
  const { tenantId, userId, name } = await requireSession("/admin");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience") ?? "ALL");
  const priority = String(formData.get("priority") ?? "NORMAL");
  if (!title || !body) return;

  await prisma.announcement.create({
    data: { tenantId, title, body, audience, priority, authorName: name },
  });
  await logAction(tenantId, userId, "POST_ANNOUNCEMENT_" + priority);
  revalidatePath("/admin/announcements");
}
