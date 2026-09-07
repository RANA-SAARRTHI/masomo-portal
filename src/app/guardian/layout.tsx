import { requireSession } from "@/lib/guard";
import { DashboardShell } from "@/components/dashboard-shell";

const nav = [{ href: "/guardian", label: "Overview" }];

export default async function GuardianLayout({ children }: { children: React.ReactNode }) {
  const { role, tenantName, name } = await requireSession("/guardian");
  return (
    <DashboardShell role={role} tenantName={tenantName} userName={name} nav={nav}>
      {children}
    </DashboardShell>
  );
}
