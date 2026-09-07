import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAnySession } from "@/lib/guard";
import type { RoleName } from "@/lib/roles";

export type SearchResult = { id: string; label: string; sublabel?: string; href: string; group: string };

export async function GET(req: NextRequest) {
  const { tenantId, role } = await requireAnySession();
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const results: SearchResult[] = [];
  const canSeePeople = ["ADMIN", "PRINCIPAL", "PLATFORM_OWNER"].includes(role as RoleName);

  if (canSeePeople) {
    const [students, staff] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId, role: "STUDENT", OR: [{ name: { contains: q } }, { email: { contains: q } }] },
        include: { studentProfile: true },
        take: 5,
      }),
      prisma.user.findMany({
        where: { tenantId, role: { notIn: ["STUDENT", "GUARDIAN"] }, name: { contains: q } },
        take: 5,
      }),
    ]);
    for (const s of students) {
      results.push({ id: s.id, label: s.name, sublabel: s.studentProfile?.admissionNo, href: "/admin/students", group: "Students" });
    }
    for (const s of staff) {
      results.push({ id: s.id, label: s.name, sublabel: s.role, href: "/admin/staff", group: "Staff" });
    }
  }

  const [classGroups, subjects, announcements] = await Promise.all([
    prisma.classGroup.findMany({ where: { tenantId, name: { contains: q } }, take: 5 }),
    prisma.subject.findMany({ where: { tenantId, name: { contains: q } }, take: 5 }),
    prisma.announcement.findMany({ where: { tenantId, title: { contains: q } }, take: 5 }),
  ]);
  for (const c of classGroups) results.push({ id: c.id, label: c.name, sublabel: "Class", href: "/admin/classes", group: "Classes" });
  for (const s of subjects) results.push({ id: s.id, label: s.name, sublabel: s.code, href: "/admin/classes", group: "Subjects" });
  for (const a of announcements) results.push({ id: a.id, label: a.title, sublabel: "Announcement", href: "/admin/announcements", group: "Announcements" });

  return NextResponse.json({ results: results.slice(0, 20) });
}
