import { redirect } from "next/navigation";
import { requireAnySession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { gradeFor } from "@/lib/grading";
import { PrintButton } from "./print-button";

export default async function ReportCardPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; termId?: string }>;
}) {
  const { role, userId, tenantId } = await requireAnySession();
  const sp = await searchParams;

  let studentId = sp.studentId;

  // Authorization: admins/principals may view any student at their school;
  // a guardian only a verified linked child; a student only themselves;
  // a teacher only a student currently in one of their assigned classes.
  if (role === "STUDENT") {
    const own = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!own) redirect("/student");
    studentId = own.id;
  } else if (role === "GUARDIAN") {
    if (!studentId) redirect("/guardian");
    const link = await prisma.guardianLink.findFirst({ where: { guardianId: userId, studentId, verified: true } });
    if (!link) redirect("/guardian");
  } else if (role === "TEACHER") {
    if (!studentId) redirect("/teacher");
    const student = await prisma.studentProfile.findUnique({ where: { id: studentId } });
    const staff = await prisma.staffProfile.findUnique({ where: { userId } });
    const allowed =
      student?.classGroupId && staff
        ? await prisma.teacherAllocation.findFirst({ where: { teacherId: staff.id, classGroupId: student.classGroupId } })
        : null;
    if (!allowed) redirect("/teacher");
  } else if (!["ADMIN", "PRINCIPAL", "PLATFORM_OWNER"].includes(role)) {
    redirect("/redirect");
  }

  if (!studentId) redirect("/redirect");

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: { user: true, classGroup: true },
  });
  if (!student || student.user.tenantId !== tenantId) redirect("/redirect");

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  const term = sp.termId
    ? await prisma.term.findUnique({ where: { id: sp.termId } })
    : await prisma.term.findFirst({ where: { academicYear: { tenantId } }, orderBy: { startDate: "desc" } });

  const marks = term
    ? await prisma.markEntry.findMany({
        where: { studentId: student.id, assessment: { termId: term.id, state: "PUBLISHED" } },
        include: { assessment: { include: { subject: true } } },
        orderBy: { assessment: { subject: { name: "asc" } } },
      })
    : [];

  const attendance = term
    ? await prisma.attendanceRecord.findMany({
        where: { studentId: student.id, date: { gte: term.startDate, lte: term.endDate } },
      })
    : [];
  const daysPresent = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendanceRate = attendance.length ? Math.round((daysPresent / attendance.length) * 100) : null;

  const scored = marks.filter((m) => m.state === "ENTERED" && m.score != null);
  const overallPct = scored.length
    ? scored.reduce((sum, m) => sum + (m.score! / m.assessment.maxMark) * 100, 0) / scored.length
    : null;
  const overall = overallPct != null ? gradeFor(overallPct) : null;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <PrintButton />
      <div className="max-w-3xl mx-auto bg-white shadow-lg print:shadow-none my-8 print:my-0 p-10 print:p-6 text-slate-900">
        <div className="flex items-center justify-between border-b-2 pb-4" style={{ borderColor: tenant.primaryColor }}>
          <div>
            <h1 className="text-xl font-bold" style={{ color: tenant.primaryColor }}>
              {tenant.name}
            </h1>
            <p className="text-sm text-slate-500">{tenant.district ? `${tenant.district}, Uganda` : "Uganda"}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Term Report Card</p>
            <p className="text-sm text-slate-500">{term?.name ?? "No term selected"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
          <div>
            <p>
              <span className="text-slate-500">Student:</span> <span className="font-medium">{student.user.name}</span>
            </p>
            <p>
              <span className="text-slate-500">Admission no.:</span> {student.admissionNo}
            </p>
          </div>
          <div>
            <p>
              <span className="text-slate-500">Class:</span> {student.classGroup?.name ?? "—"}
            </p>
            <p>
              <span className="text-slate-500">Attendance:</span> {attendanceRate != null ? `${attendanceRate}% present` : "No record for this term"}
            </p>
          </div>
        </div>

        <table className="w-full mt-6 text-sm border-collapse">
          <thead>
            <tr className="text-left border-b-2 border-slate-800">
              <th className="py-2">Subject</th>
              <th className="py-2">Assessment</th>
              <th className="py-2 text-right">Score</th>
              <th className="py-2 text-right">%</th>
              <th className="py-2 text-right">Grade</th>
              <th className="py-2">Remark</th>
            </tr>
          </thead>
          <tbody>
            {marks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  No published results for this term yet.
                </td>
              </tr>
            ) : (
              marks.map((m) => {
                const pct = m.state === "ENTERED" && m.score != null ? (m.score / m.assessment.maxMark) * 100 : null;
                const g = pct != null ? gradeFor(pct) : null;
                return (
                  <tr key={m.id} className="border-b border-slate-200">
                    <td className="py-1.5 font-medium">{m.assessment.subject.name}</td>
                    <td className="py-1.5 text-slate-500">{m.assessment.name}</td>
                    <td className="py-1.5 text-right">
                      {m.state === "ENTERED" ? `${m.score}/${m.assessment.maxMark}` : m.state}
                    </td>
                    <td className="py-1.5 text-right">{pct != null ? pct.toFixed(0) : "—"}</td>
                    <td className="py-1.5 text-right font-semibold">{g?.grade ?? "—"}</td>
                    <td className="py-1.5 text-slate-500">{g?.remark ?? ""}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {overall && (
          <div className="mt-4 flex justify-end gap-6 text-sm font-medium">
            <span>Overall average: {overallPct!.toFixed(1)}%</span>
            <span>Overall grade: {overall.grade} — {overall.remark}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 mt-16 text-sm">
          <div>
            <div className="border-t border-slate-400 pt-1">Class teacher's signature</div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1">Principal's signature</div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-10 text-center">
          Generated by Masomo on {new Date().toLocaleDateString()} · Reference: {student.id.slice(-8).toUpperCase()}-{term?.id.slice(-6).toUpperCase() ?? "NA"}
        </p>
      </div>
    </div>
  );
}
