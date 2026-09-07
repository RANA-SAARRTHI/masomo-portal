import { requireSession } from "@/lib/guard";
import { DashboardShell } from "@/components/dashboard-shell";

const nav = [
  { href: "/student", label: "Today" },
  { href: "/student/materials", label: "Materials" },
  { href: "/student/assignments", label: "Assignments" },
  { href: "/student/results", label: "Results" },
  { href: "/student/attendance", label: "Attendance" },
  { href: "/student/messages", label: "Messages" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { role, tenantName, name } = await requireSession("/student");
  return (
    <DashboardShell role={role} tenantName={tenantName} userName={name} nav={nav}>
      {children}
    </DashboardShell>
  );
}
