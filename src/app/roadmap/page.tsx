import Link from "next/link";

const live = [
  "Role-based login for principal, admin, teacher, student, guardian, bursar, librarian, transport officer",
  "Multi-tenant data model with server-side tenant and role scoping on every page",
  "Student admission, staff records, class and subject setup, teacher allocation",
  "Attendance register with present/absent/late/excused and per-student reasons",
  "Learning materials and assignments with student submission and teacher grading",
  "Marks entry with blank/absent/exempt states, submitted for moderation, then approved and published by a principal or delegated approver — teachers cannot publish their own results",
  "Announcements with audience targeting and priority, plus class-level teacher messages",
  "Fees: fee structures, invoices, cash/bank/mobile-money payment recording, reversal with reason",
  "Guardian portal with a child switcher across multiple linked children",
  "Library catalogue with issue/return tracking, and a basic transport route/assignment module",
  "Attendance, enrolment and fee-collection charts on the admin reports page, with CSV export",
  "A weekly timetable builder for admins, with matching read-only views for teachers and students",
  "Bulk CSV import for student admissions with a validation-only preview before anything is written",
  "A tenant-scoped search box for finding students, staff, classes and subjects",
  "Login rate limiting: an account locks for 15 minutes after 5 failed attempts",
  "Audit log of logins, failed logins and sensitive actions",
  "Installable PWA shell for low-end Android phones",
  "Printable, school-branded report cards with grades, attendance and signature lines — one click from student, guardian or admin views",
  "Timetable clash detection: rejects overlapping periods for the same class, room or teacher, with a plain-language reason",
  "Teacher substitution: mark a period covered, only teachers genuinely free at that day and time are offered, and the substitute sees it on their dashboard",
  "Two-person result moderation: any admin or principal moderates a submitted assessment, but only a principal can take the final publish step — a real separation of duties, not just a status label",
  "Wellbeing, discipline, safeguarding and health case records, restricted to principals and administrators only — ordinary teachers have no route into this area at all",
  "Offline-first attendance: a teacher's register is drafted on the device, saved locally if the connection drops, and submits automatically the moment it's back online — nothing is silently lost",
];

const planned = [
  "Multi-factor authentication for finance, admin and leadership roles — needs no third party, next up",
  "Real SMS and mobile money provider integration with signed callback verification — needs a contracted Ugandan provider (e.g. a licensed aggregator) and live API credentials",
  "Scheduled and exportable reports with watermarking for sensitive data",
  "Shared rate-limit store (Redis) so login lockouts hold across multiple server instances — needs a Redis instance to be provisioned",
  "Postgres in production with automated encrypted backups and tested restores — needs a hosting/database provider decision",
];

export default function RoadmapPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/" className="text-sm text-brand-700 hover:underline">
        ← Back home
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mt-4">What's built, and what's next</h1>
      <p className="text-slate-600 mt-2">
        A screen that looks finished is not the same as a screen that is finished. Here is an honest split
        between what works today and what's still on the roadmap.
      </p>

      <div className="grid sm:grid-cols-2 gap-6 mt-8">
        <div>
          <h2 className="font-semibold text-brand-700 mb-3">Live today</h2>
          <ul className="space-y-2">
            {live.map((item) => (
              <li key={item} className="text-sm text-slate-700 bg-brand-50 rounded-lg px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-amber-700 mb-3">Planned next</h2>
          <ul className="space-y-2">
            {planned.map((item) => (
              <li key={item} className="text-sm text-slate-700 bg-amber-50 rounded-lg px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
