import { prisma } from "@/lib/prisma";

export async function getTeacherAllocations(userId: string) {
  const staff = await prisma.staffProfile.findUnique({
    where: { userId },
    include: {
      allocations: { include: { subject: true, classGroup: { include: { students: { include: { user: true } } } } } },
    },
  });
  return staff;
}
