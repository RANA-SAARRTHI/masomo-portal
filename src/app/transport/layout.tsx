import { requireSession } from "@/lib/guard";
import { DashboardShell } from "@/components/dashboard-shell";

const nav = [{ href: "/transport", label: "Routes" }];

export default async function TransportLayout({ children }: { children: React.ReactNode }) {
  const { role, tenantName, name } = await requireSession("/transport");
  return (
    <DashboardShell role={role} tenantName={tenantName} userName={name} nav={nav}>
      {children}
    </DashboardShell>
  );
}
