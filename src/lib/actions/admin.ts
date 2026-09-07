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

export async function createTimetableSlot(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "");
  const dayOfWeek = Number(formData.get("dayOfWeek") ?? 1);
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const room = String(formData.get("room") ?? "").trim();
  if (!classGroupId || !subjectId || !startTime || !endTime) return;

  await prisma.timetableSlot.create({
    data: { classGroupId, subjectId, dayOfWeek, startTime, endTime, room: room || null },
  });
  await logAction(tenantId, userId, "CREATE_TIMETABLE_SLOT", classGroupId);
  revalidatePath("/admin/timetable");
}

export async function deleteTimetableSlot(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const slotId = String(formData.get("slotId") ?? "");
  if (!slotId) return;
  await prisma.timetableSlot.delete({ where: { id: slotId } });
  await logAction(tenantId, userId, "DELETE_TIMETABLE_SLOT", slotId);
  revalidatePath("/admin/timetable");
}

export async function approveAndPublishAssessment(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const assessmentId = String(formData.get("assessmentId") ?? "");
  if (!assessmentId) return;
  await prisma.assessment.update({ where: { id: assessmentId }, data: { state: "PUBLISHED", publishedAt: new Date() } });
  await logAction(tenantId, userId, "APPROVE_AND_PUBLISH_ASSESSMENT", assessmentId);
  revalidatePath("/admin/moderation");
}

export async function sendBackToTeacher(formData: FormData) {
  const { tenantId, userId } = await requireSession("/admin");
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!assessmentId) return;
  await prisma.assessment.update({ where: { id: assessmentId }, data: { state: "OPEN" } });
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
