import Link from "next/link";

const features = [
  { title: "Attendance", body: "Teachers mark present, absent, late or excused for every class in seconds. Guardians get an alert when a child is unexpectedly away." },
  { title: "Learning materials", body: "Post notes, links and assignments to the right class. Students submit work and get feedback without a single WhatsApp group." },
  { title: "Marks and report cards", body: "Enter marks, moderate by department, publish once approved. Students and guardians only ever see the final, approved result." },
  { title: "Fees and receipts", body: "Track invoices, record cash, bank and mobile money payments, and give every guardian a clear balance." },
  { title: "Announcements", body: "Reach the whole school, one class or just staff. Emergency notices stand out and require acknowledgement." },
  { title: "Reports", body: "Attendance, collections and academic performance in one dashboard, exportable when you need to share them." },
];

const roles = [
  "Principals and administrators",
  "Teachers",
  "Students",
  "Guardians",
  "Bursars",
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">M</div>
            <span className="font-semibold text-lg">Masomo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/roadmap" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:inline dark:text-slate-400">
              Roadmap
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <span className="inline-flex items-center rounded-full bg-brand-100 text-brand-700 px-3 py-1 text-sm font-medium mb-4">
            Built for schools in Uganda
          </span>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 max-w-3xl mx-auto dark:text-slate-100">
            One portal for your whole school
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto dark:text-slate-400">
            Masomo brings attendance, class materials, results, fees and communication into one place
            for primary, secondary and vocational institutions. Works well on ordinary phones and slow
            connections.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="bg-brand-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-700">
              Sign in to your school
            </Link>
            <Link href="/roadmap" className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-lg font-medium hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
              See what's built so far
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Demo login available on the sign-in page for every role: principal, teacher, student, guardian and bursar.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-semibold text-center text-slate-900 dark:text-slate-100">Everything your school runs on, digitised</h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-5 dark:bg-slate-900 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 text-center">
          <h2 className="text-2xl font-semibold">One account, the right view for every person</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {roles.map((r) => (
              <span key={r} className="bg-white/10 rounded-full px-4 py-2 text-sm">
                {r}
              </span>
            ))}
          </div>
          <p className="mt-6 text-slate-300 max-w-xl mx-auto text-sm">
            Every person only sees what their role and their school relationships allow. Guardians see
            only their own children. Teachers see only their assigned classes.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span>Masomo &mdash; a school portal built for Uganda, usable anywhere.</span>
          <Link href="/roadmap" className="hover:text-slate-800">
            Product roadmap
          </Link>
        </div>
      </footer>
    </div>
  );
}
