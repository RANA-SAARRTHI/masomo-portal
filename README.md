# Masomo

Masomo is a school management portal built for primary, secondary and vocational
institutions in Uganda. It works well anywhere, but the defaults (currency,
timezone, language of examples) target Uganda.

The name comes from "masomo", the East African word for lessons or studies. It
is short, easy to say over a phone call, and familiar without belonging to any
one school.

One account per person, one view per role. A teacher only ever sees their
assigned classes. A guardian only ever sees their own children. A student only
ever sees their own results, and only once a teacher has published them.

## What it does today

- **Admin**: admit students, add staff, build classes and subjects, allocate
  teachers to a subject and class, post school-wide announcements, edit school
  branding.
- **Teacher**: take attendance per class, post learning materials, set
  assignments and grade submissions, enter and publish marks, message a class.
- **Student**: see today's assignments and materials, submit work, check
  published results, see personal attendance, read notices.
- **Guardian**: switch between multiple linked children, see attendance,
  published results, and a fee statement for each.
- **Bursar**: set up fee structures, raise invoices, record cash / bank /
  mobile money payments, reverse a payment with a reason.
- **Librarian**: catalogue, issue and return books.
- **Transport officer**: routes, vehicles, driver and learner assignment.
- **Reports**: attendance breakdown, students per class, fee collection, all
  as charts on the admin dashboard.
- Every login and sensitive action is written to an audit log.
- Works as an installable PWA on low-end Android phones.

See `/roadmap` inside the running app for the full, honest breakdown of what's
live versus what's still planned. Visual completeness is not completion — a
screen only counts once the permission checks, data, and workflow behind it
are real, which is the standard this build follows throughout.

## Stack

- Next.js 16 (App Router, Server Actions) + TypeScript
- Tailwind CSS 4
- Prisma ORM, SQLite for local development
- NextAuth (Credentials provider, JWT sessions, bcrypt password hashing)
- Recharts for the reports dashboard

The schema uses plain string fields instead of native enums so it runs on
SQLite locally with zero setup. To move to production, point `DATABASE_URL`
at Postgres, change `provider = "sqlite"` to `provider = "postgresql"` in
`prisma/schema.prisma`, and re-run `npx prisma db push` (or switch to
`prisma migrate` for versioned migrations).

## Getting started

```bash
npm install
cp .env.example .env      # already done if you cloned this repo fresh — edit NEXTAUTH_SECRET
npm run db:push           # creates the SQLite database from the schema
npm run db:seed           # loads a demo school with realistic data
npm run dev
```

Open http://localhost:3000. Sign in at `/login` — the page has one-click demo
account buttons for every role.

### Demo accounts

All demo accounts use the password `Masomo@2026`.

| Role | Email |
|---|---|
| Principal | principal@masomo-demo.ug |
| Administrator | admin@masomo-demo.ug |
| Teacher | teacher@masomo-demo.ug |
| Teacher (second, for substitution cover) | teacher2@masomo-demo.ug |
| Bursar | bursar@masomo-demo.ug |
| Student | student@masomo-demo.ug |
| Guardian | guardian@masomo-demo.ug |
| Librarian | librarian@masomo-demo.ug |
| Transport officer | transport@masomo-demo.ug |

To wipe and reload demo data: `npm run db:reset`.

## Project structure

```
prisma/schema.prisma      Data model (tenants, users, students, staff, classes,
                           attendance, assessments, fees, library, transport...)
prisma/seed.ts             Demo data loader
src/lib/auth.ts            NextAuth config
src/lib/guard.ts           Server-side session + role/section access check
src/lib/roles.ts           Role list, labels, and which dashboard section each
                           role may open
src/lib/actions/*          Server Actions per role (the only way data changes)
src/app/(marketing)        Landing page and /roadmap
src/app/login              Sign-in page with demo shortcuts
src/app/admin ...          One folder per role dashboard
src/middleware.ts          Route-level auth gate
```

Every dashboard route is protected twice: `middleware.ts` blocks
unauthenticated requests, and `requireSession()` inside each layout checks
that the signed-in user's role is actually allowed into that section — a
teacher hitting `/bursar` directly gets redirected, not a hidden button.

## Multi-tenancy

Every school-owned table carries a `tenantId`. The tenant a request can see
always comes from the authenticated session (`requireSession()`), never from
a client-supplied value, so one school's data cannot be reached by editing a
URL or form field on another.

## What was added beyond the original brief

The build follows a client blueprint written for a platform called "Somesa";
this product is intentionally renamed and re-scoped to ship a working core
rather than every module in that document at once. On top of the blueprint,
this build adds: an installable PWA manifest for low-end Android phones, a
dedicated `/roadmap` page inside the app itself so nobody mistakes a working
demo for a finished product, chart-based reporting on the admin dashboard, and
a reversible-payment flow with a required reason on every reversal.

## License

Proprietary — built for internal use and client deployment.
