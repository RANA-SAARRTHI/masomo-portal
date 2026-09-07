"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guard";

export async function submitAssignment(formData: FormData) {
  const { userId, tenantId } = await requireSession("/student");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!assignmentId || !text) return;

  const student = await prisma.studentProfile.findUnique({ where: { userId } });
  const assignment = await prisma.assignment.findFirst({ where: { id: assignmentId, subject: { tenantId } } });
  if (!student || !assignment) return;

  const late = new Date() > assignment.dueDate;
  if (late && !assignment.allowLate) return;

  await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
    update: { text, submittedById: userId, submittedAt: new Date(), late },
    create: { assignmentId, studentId: student.id, submittedById: userId, text, late },
  });
  revalidatePath("/student/assignments");
}
