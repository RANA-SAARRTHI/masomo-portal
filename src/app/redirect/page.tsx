import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLE_HOME, type RoleName } from "@/lib/roles";

export default async function RedirectPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role as RoleName;
  redirect(ROLE_HOME[role] ?? "/login");
}
