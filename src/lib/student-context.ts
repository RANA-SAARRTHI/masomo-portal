import { prisma } from "@/lib/prisma";

export async function getStudentProfile(userId: string) {
  return prisma.studentProfile.findUnique({
    where: { userId },
    include: { classGroup: true, user: true },
  });
}
