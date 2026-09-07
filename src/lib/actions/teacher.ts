"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";

async function assertOwnsClassSubject(userId: string, classGroupId: string, subjectId: string) {
  const staff = await prisma.staffProfile.findUnique({ where: { userId } });
  if (!staff) throw new Error("Not a staff member");
  const allocation = await prisma.teacherAllocation.findUnique({
    where: { teacherId_subjectId_classGroupId: { teacherId: staff.id, subjectId, classGroupId } },
  });
  if (!allocation) throw new Error("Not authorised for this class/subject");
  return staff;
}

export async function submitAttendance(formData: FormData) {
  const { userId, tenantId } = await requireSession("/teacher");
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const studentIds = formData.getAll("studentId").map(String);
  if (!classGroupId || !dateStr) return;

  const date = new Date(dateStr + "T00:00:00");

  for (const studentId of studentIds) {
    const status = String(formData.get(`status-${studentId}`) ?? "PRESENT");
    const reason = String(formData.get(`reason-${studentId}`) ?? "");
    await prisma.attendanceRecord.upsert({
      where: { studentId_date: { studentId, date } },
      update: { status, reason: reason || null, markedById: userId },
      create: { studentId, classGroupId, date, status, reason: reason || null, markedById: userId },
    });
  }
  await prisma.auditLog.create({ data: { tenantId, actorId: userId, action: "SUBMIT_ATTENDANCE", target: classGroupId } });
  revalidatePath("/teacher/attendance");
}

export async function postMaterial(formData: FormData) {
  const { userId } = await requireSession("/teacher");
  const [subjectId, classGroupId] = String(formData.get("combo") ?? "").split("|");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "DOCUMENT");
  const url = String(formData.get("url") ?? "").trim();
  if (!title || !subjectId) return;
  await assertOwnsClassSubject(userId, classGroupId, subjectId);

  await prisma.contentItem.create({
    data: { subjectId, title, description, type, url, audience: classGroupId },
  });
  revalidatePath("/teacher/materials");
}

export async function postAssignment(formData: FormData) {
  const { userId } = await requireSession("/teacher");
  const [subjectId, classGroupId] = String(formData.get("combo") ?? "").split("|");
  const title = String(formData.get("title") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");
  const allowLate = formData.get("allowLate") === "on";
  if (!title || !subjectId || !dueDate) return;
  await assertOwnsClassSubject(userId, classGroupId, subjectId);

  await prisma.assignment.create({
    data: { subjectId, title, instructions, dueDate: new Date(dueDate), allowLate },
  });
  revalidatePath("/teacher/assignments");
}

export async function gradeSubmission(formData: FormData) {
  await requireSession("/teacher");
  const submissionId = String(formData.get("submissionId") ?? "");
  const score = Number(formData.get("score") ?? 0);
  const feedback = String(formData.get("feedback") ?? "");
  if (!submissionId) return;
  await prisma.submission.update({ where: { id: submissionId }, data: { score, feedback } });
  revalidatePath("/teacher/assignments");
}

export async function saveMarks(formData: FormData) {
  const { userId, tenantId } = await requireSession("/teacher");
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const studentIds = formData.getAll("studentId").map(String);
  if (!assessmentId) return;

  for (const studentId of studentIds) {
    const stateRaw = String(formData.get(`state-${studentId}`) ?? "ENTERED");
    const scoreRaw = String(formData.get(`score-${studentId}`) ?? "");
    const score = stateRaw === "ENTERED" && scoreRaw !== "" ? Number(scoreRaw) : null;
    await prisma.markEntry.upsert({
      where: { assessmentId_studentId: { assessmentId, studentId } },
      update: { score, state: stateRaw },
      create: { assessmentId, studentId, score, state: stateRaw },
    });
  }
  await prisma.auditLog.create({ data: { tenantId, actorId: userId, action: "ENTER_MARKS", target: assessmentId } });
  revalidatePath("/teacher/marks");
}

export async function createAssessment(formData: FormData) {
  const { userId } = await requireSession("/teacher");
  const subjectId = String(formData.get("subjectId") ?? "");
  const termId = String(formData.get("termId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const maxMark = Number(formData.get("maxMark") ?? 100);
  if (!subjectId || !termId || !name) return;
  await prisma.assessment.create({ data: { subjectId, termId, name, maxMark, state: "OPEN" } });
  revalidatePath("/teacher/marks");
}

export async function publishAssessment(formData: FormData) {
  await requireSession("/teacher");
  const assessmentId = String(formData.get("assessmentId") ?? "");
  if (!assessmentId) return;
  await prisma.assessment.update({ where: { id: assessmentId }, data: { state: "PUBLISHED", publishedAt: new Date() } });
  revalidatePath("/teacher/marks");
}

export async function postClassMessage(formData: FormData) {
  const { tenantId, name } = await requireSession("/teacher");
  const classGroupId = String(formData.get("classGroupId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!classGroupId || !title || !body) return;
  await prisma.announcement.create({
    data: { tenantId, title, body, audience: `CLASS:${classGroupId}`, priority: "NORMAL", authorName: name },
  });
  revalidatePath("/teacher/messages");
}
