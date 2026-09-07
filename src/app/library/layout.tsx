import { requireSession } from "@/lib/guard";
import { DashboardShell } from "@/components/dashboard-shell";

const nav = [{ href: "/library", label: "Catalogue" }];

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const { role, tenantName, name } = await requireSession("/library");
  return (
    <DashboardShell role={role} tenantName={tenantName} userName={name} nav={nav}>
      {children}
    </DashboardShell>
  );
}
