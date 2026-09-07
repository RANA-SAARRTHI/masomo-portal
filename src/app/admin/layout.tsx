import { requireSession } from "@/lib/guard";
import { DashboardShell } from "@/components/dashboard-shell";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/import", label: "Bulk import" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/classes", label: "Classes & subjects" },
  { href: "/admin/timetable", label: "Timetable" },
  { href: "/admin/substitutions", label: "Substitutions" },
  { href: "/admin/moderation", label: "Result moderation" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, tenantName, name } = await requireSession("/admin");
  return (
    <DashboardShell role={role} tenantName={tenantName} userName={name} nav={nav}>
      {children}
    </DashboardShell>
  );
}
