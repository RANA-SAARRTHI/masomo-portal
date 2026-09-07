import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessSection, type RoleName } from "@/lib/roles";

export async function requireSession(section: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role as RoleName;
  if (!canAccessSection(role, section)) redirect("/redirect");
  return {
    role,
    userId: (session.user as any).id as string,
    tenantId: (session.user as any).tenantId as string,
    tenantName: (session.user as any).tenantName as string,
    name: session.user.name ?? "",
  };
}
