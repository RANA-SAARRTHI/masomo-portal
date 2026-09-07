import { clsx } from "clsx";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx("bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {subtitle ? <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "brand" | "amber" | "rose" | "slate";
}) {
  const tones: Record<string, string> = {
    brand: "text-brand-700 bg-brand-50 dark:text-brand-300 dark:bg-brand-900/40",
    amber: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30",
    rose: "text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-900/30",
    slate: "text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800",
  };
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
        <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium", tones[tone])}>{hint ?? ""}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    </Card>
  );
}

export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "brand" | "amber" | "rose" | "slate" | "emerald" }) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  };
  return <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="text-center py-10 px-4">
      <p className="font-medium text-slate-700 dark:text-slate-300">{title}</p>
      {body ? <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{body}</p> : null}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const variants: Record<string, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };
  return (
    <button
      className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed", variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 placeholder:text-slate-400 dark:placeholder:text-slate-500",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
        props.className
      )}
    />
  );
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">
      {children}
    </label>
  );
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            {head.map((h) => (
              <th key={h} className="py-2 px-3 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">{children}</tbody>
      </table>
    </div>
  );
}
