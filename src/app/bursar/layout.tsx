import { requireSession } from "@/lib/guard";
import { DashboardShell } from "@/components/dashboard-shell";

const nav = [
  { href: "/bursar", label: "Overview" },
  { href: "/bursar/invoices", label: "Invoices" },
  { href: "/bursar/payments", label: "Payments" },
];

export default async function BursarLayout({ children }: { children: React.ReactNode }) {
  const { role, tenantName, name } = await requireSession("/bursar");
  return (
    <DashboardShell role={role} tenantName={tenantName} userName={name} nav={nav}>
      {children}
    </DashboardShell>
  );
}
