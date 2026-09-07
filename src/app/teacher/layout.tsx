import { requireSession } from "@/lib/guard";
import { DashboardShell } from "@/components/dashboard-shell";

const nav = [
  { href: "/teacher", label: "My classes" },
  { href: "/teacher/attendance", label: "Attendance" },
  { href: "/teacher/materials", label: "Materials" },
  { href: "/teacher/assignments", label: "Assignments" },
  { href: "/teacher/marks", label: "Marks" },
  { href: "/teacher/messages", label: "Messages" },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { role, tenantName, name } = await requireSession("/teacher");
  return (
    <DashboardShell role={role} tenantName={tenantName} userName={name} nav={nav}>
      {children}
    </DashboardShell>
  );
}
