import Link from "next/link";
import { requireAnySession } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { ROLE_HOME, type RoleName } from "@/lib/roles";
import { MfaPanel } from "./mfa-panel";

export default async function SecuritySettingsPage() {
  const { userId, role } = await requireAnySession();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-800">
      <div className="max-w-xl mx-auto">
        <Link href={ROLE_HOME[role as RoleName] ?? "/redirect"} className="text-sm text-brand-700 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 mt-4 mb-1 dark:text-slate-100">Account security</h1>
        <p className="text-sm text-slate-500 mb-6 dark:text-slate-400">Signed in as {user.email}</p>
        <MfaPanel initiallyEnabled={user.mfaEnabled} />
      </div>
    </div>
  );
}
