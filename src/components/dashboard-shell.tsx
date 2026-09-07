import Link from "next/link";
import { ROLE_LABELS, type RoleName } from "@/lib/roles";
import { SignOutButton } from "@/components/sign-out-button";
import { GlobalSearch } from "@/components/global-search";
import { ThemeToggle } from "@/components/theme-toggle";

export type NavItem = { href: string; label: string; icon?: string };

export function DashboardShell({
  role,
  tenantName,
  userName,
  termLabel,
  nav,
  children,
}: {
  role: RoleName;
  tenantName: string;
  userName: string;
  termLabel?: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="lg:w-64 shrink-0 bg-brand-900 text-white flex lg:flex-col">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center font-bold">M</div>
          <div className="leading-tight">
            <div className="font-semibold">Masomo</div>
            <div className="text-xs text-white/60 truncate max-w-[10rem]">{tenantName}</div>
          </div>
        </div>
        <nav className="flex-1 overflow-x-auto lg:overflow-visible p-2 flex lg:flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg text-sm text-white/85 hover:bg-white/10 hover:text-white whitespace-nowrap transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 hidden lg:block">
          <Link href="/roadmap" className="text-xs text-white/60 hover:text-white">
            What&apos;s live vs. planned →
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 min-w-0">
            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{tenantName}</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="inline-flex items-center rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-2 py-0.5 text-xs font-medium">
              {ROLE_LABELS[role]}
            </span>
            {termLabel ? (
              <>
                <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
                <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">{termLabel}</span>
              </>
            ) : null}
          </div>
          {(role === "ADMIN" || role === "PRINCIPAL" || role === "PLATFORM_OWNER") && (
            <div className="hidden md:block flex-1 max-w-xs mx-4">
              <GlobalSearch />
            </div>
          )}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:inline">{userName}</span>
            {role !== "STUDENT" && role !== "GUARDIAN" && (
              <Link
                href="/account/leave"
                className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hidden lg:inline"
              >
                My leave
              </Link>
            )}
            {role === "BURSAR" && (
              <Link
                href="/account/reports"
                className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hidden lg:inline"
              >
                My reports
              </Link>
            )}
            <Link
              href="/account/security"
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hidden sm:inline"
            >
              Security
            </Link>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
