import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "Masomo@2026";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const tenant = await prisma.tenant.create({
    data: {
      name: "Masomo Demo Secondary School",
      slug: "masomo-demo",
      type: "SECONDARY",
      district: "Kampala",
    },
  });

  const year = await prisma.academicYear.create({
    data: { tenantId: tenant.id, name: "2026", isCurrent: true },
  });
  const term = await prisma.term.create({
    data: {
      academicYearId: year.id,
      name: "Term 2",
      startDate: new Date("2026-05-04"),
      endDate: new Date("2026-08-14"),
      state: "OPEN",
    },
  });

  const classS4East = await prisma.classGroup.create({ data: { tenantId: tenant.id, name: "S4 East", level: "Senior 4" } });
  const classS3West = await prisma.classGroup.create({ data: { tenantId: tenant.id, name: "S3 West", level: "Senior 3" } });

  const math = await prisma.subject.create({ data: { tenantId: tenant.id, name: "Mathematics", code: "MATH" } });
  const english = await prisma.subject.create({ data: { tenantId: tenant.id, name: "English", code: "ENG" } });
  const biology = await prisma.subject.create({ data: { tenantId: tenant.id, name: "Biology", code: "BIO" } });

  const principal = await prisma.user.create({
    data: { tenantId: tenant.id, name: "Namutebi Sarah", email: "principal@masomo-demo.ug", role: "PRINCIPAL", passwordHash },
  });
  const admin = await prisma.user.create({
    data: { tenantId: tenant.id, name: "Kiggundu Robert", email: "admin@masomo-demo.ug", role: "ADMIN", passwordHash },
  });
  const bursarUser = await prisma.user.create({
    data: { tenantId: tenant.id, name: "Achieng Brenda", email: "bursar@masomo-demo.ug", role: "BURSAR", passwordHash },
  });
  const teacherUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "Mugisha John",
      email: "teacher@masomo-demo.ug",
      role: "TEACHER",
      passwordHash,
      staffProfile: { create: { staffNo: "ST-001", department: "Sciences", title: "Senior Teacher" } },
    },
    include: { staffProfile: true },
  });
  const librarian = await prisma.user.create({
    data: { tenantId: tenant.id, name: "Namuli Joan", email: "librarian@masomo-demo.ug", role: "LIBRARIAN", passwordHash },
  });
  const transportOfficer = await prisma.user.create({
    data: { tenantId: tenant.id, name: "Ssekandi Tom", email: "transport@masomo-demo.ug", role: "TRANSPORT_OFFICER", passwordHash },
  });

  await prisma.teacherAllocation.createMany({
    data: [
      { teacherId: teacherUser.staffProfile!.id, subjectId: math.id, classGroupId: classS4East.id, isClassTeacher: true },
      { teacherId: teacherUser.staffProfile!.id, subjectId: biology.id, classGroupId: classS4East.id },
      { teacherId: teacherUser.staffProfile!.id, subjectId: math.id, classGroupId: classS3West.id },
    ],
  });

  const studentNames = [
    ["Nabirye Grace", "MS-2026-001", classS4East.id],
    ["Okello Brian", "MS-2026-002", classS4East.id],
    ["Atim Sharon", "MS-2026-003", classS4East.id],
    ["Byaruhanga Isaac", "MS-2026-004", classS3West.id],
    ["Nakato Patricia", "MS-2026-005", classS3West.id],
  ] as const;

  const students = [];
  for (const [name, admissionNo, classGroupId] of studentNames) {
    const email = name.toLowerCase().replace(/\s+/g, ".") + "@masomo-demo.ug";
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name,
        email,
        role: "STUDENT",
        passwordHash,
        studentProfile: { create: { admissionNo, classGroupId } },
      },
      include: { studentProfile: true },
    });
    students.push(user);
  }

  const demoStudent = students[0];
  const guardian = await prisma.user.create({
    data: { tenantId: tenant.id, name: "Nabirye Alice", email: "guardian@masomo-demo.ug", role: "GUARDIAN", passwordHash },
  });
  await prisma.guardianLink.create({
    data: { guardianId: guardian.id, studentId: demoStudent.studentProfile!.id, relationship: "Mother", verified: true },
  });

  const demoLoginStudent = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "Demo Student",
      email: "student@masomo-demo.ug",
      role: "STUDENT",
      passwordHash,
      studentProfile: { create: { admissionNo: "MS-2026-000", classGroupId: classS4East.id } },
    },
    include: { studentProfile: true },
  });
  await prisma.guardianLink.create({
    data: { guardianId: guardian.id, studentId: demoLoginStudent.studentProfile!.id, relationship: "Mother", verified: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    for (const s of [...students, demoLoginStudent]) {
      const status = i === 2 && s.id === demoLoginStudent.id ? "ABSENT" : i === 5 ? "LATE" : "PRESENT";
      await prisma.attendanceRecord.create({
        data: {
          studentId: s.studentProfile!.id,
          classGroupId: s.studentProfile!.classGroupId!,
          date,
          status,
          markedById: teacherUser.id,
        },
      });
    }
  }

  const assessment = await prisma.assessment.create({
    data: { termId: term.id, subjectId: math.id, name: "Midterm Exam", maxMark: 100, weight: 1, state: "PUBLISHED", publishedAt: new Date() },
  });
  for (const s of [...students, demoLoginStudent]) {
    if (s.studentProfile!.classGroupId !== classS4East.id) continue;
    await prisma.markEntry.create({
      data: { assessmentId: assessment.id, studentId: s.studentProfile!.id, score: 60 + Math.floor(Math.random() * 35), state: "ENTERED" },
    });
  }

  await prisma.contentItem.create({
    data: { subjectId: math.id, title: "Quadratic Equations - Notes", description: "Chapter 4 revision notes", type: "DOCUMENT", audience: classS4East.id },
  });

  const assignment = await prisma.assignment.create({
    data: {
      subjectId: math.id,
      title: "Problem set 3",
      instructions: "Solve questions 1-10 from the textbook and show your working.",
      dueDate: new Date(Date.now() + 5 * 86400000),
      allowLate: true,
    },
  });
  await prisma.submission.create({
    data: {
      assignmentId: assignment.id,
      studentId: demoLoginStudent.studentProfile!.id,
      submittedById: demoLoginStudent.id,
      text: "Answers attached: 1) x=2,3  2) x=-1,4 ...",
    },
  });

  await prisma.feeStructure.create({ data: { tenantId: tenant.id, name: "Tuition", amount: 850000, termLabel: "Term 2 2026", mandatory: true } });
  const invoice = await prisma.invoice.create({
    data: { tenantId: tenant.id, studentId: demoLoginStudent.studentProfile!.id, termId: term.id, reference: "INV-DEMO-001", description: "Term 2 Tuition", amount: 850000, status: "PART_PAID" },
  });
  await prisma.payment.create({
    data: { invoiceId: invoice.id, reference: "RCT-DEMO-001", amount: 400000, method: "MOBILE_MONEY", status: "SUCCESSFUL" },
  });

  await prisma.announcement.createMany({
    data: [
      { tenantId: tenant.id, title: "Term 2 resumes Monday", body: "All students are expected back on Monday 4th May with full uniform.", audience: "ALL", priority: "IMPORTANT", authorName: principal.name },
      { tenantId: tenant.id, title: "Mid-term exams begin next week", body: "Please check the timetable posted by your class teacher.", audience: "STUDENTS", priority: "NORMAL", authorName: admin.name },
    ],
  });

  await prisma.libraryItem.create({ data: { tenantId: tenant.id, title: "Advanced Mathematics for Schools", author: "J. Kariuki", copies: 3, copiesAvailable: 3 } });

  const route = await prisma.transportRoute.create({ data: { tenantId: tenant.id, name: "Kireka - Ntinda", vehicle: "UBH 123X", driver: "Sebunya Moses", capacity: 30 } });
  await prisma.transportAssignment.create({ data: { routeId: route.id, studentName: demoStudent.name, stop: "Kireka Trading Centre" } });

  console.log("Seed complete.");
  console.log("Tenant:", tenant.name);
  console.log("Demo password for every account:", PASSWORD);
  console.log("Logins: principal@masomo-demo.ug, admin@masomo-demo.ug, teacher@masomo-demo.ug, bursar@masomo-demo.ug, student@masomo-demo.ug, guardian@masomo-demo.ug, librarian@masomo-demo.ug, transport@masomo-demo.ug");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
