"use server";

import { prisma } from "@/lib/prisma";
import { requireAnySession } from "@/lib/guard";
import { generateSecret, verifyTotp, otpauthUri } from "@/lib/totp";

// Step 1: create (or replace) a pending secret and hand back the manual-entry
// key plus the otpauth:// URI for an authenticator app. Nothing is enforced
// yet — mfaEnabled stays false until confirmEnrollment succeeds.
export async function beginEnrollment(): Promise<{ secret: string; uri: string }> {
  const { userId } = await requireAnySession();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const secret = generateSecret();
  await prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret, mfaEnabled: false } });
  return { secret, uri: otpauthUri(secret, user.email) };
}

export async function confirmEnrollment(formData: FormData): Promise<{ ok: true } | never> {
  const { userId, tenantId } = await requireAnySession();
  const code = String(formData.get("code") ?? "").trim();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.mfaSecret) throw new Error("Start enrollment first.");
  if (!verifyTotp(user.mfaSecret, user.email, code)) {
    throw new Error("That code didn't match. Check the time on your phone and try again.");
  }
  await prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
  await prisma.auditLog.create({ data: { tenantId, actorId: userId, action: "MFA_ENABLED", target: userId } });
  return { ok: true };
}

export async function disableMfa(formData: FormData): Promise<{ ok: true } | never> {
  const { userId, tenantId } = await requireAnySession();
  const code = String(formData.get("code") ?? "").trim();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.mfaEnabled || !user.mfaSecret) throw new Error("MFA is not currently enabled.");
  if (!verifyTotp(user.mfaSecret, user.email, code)) {
    throw new Error("That code didn't match.");
  }
  await prisma.user.update({ where: { id: userId }, data: { mfaEnabled: false, mfaSecret: null } });
  await prisma.auditLog.create({ data: { tenantId, actorId: userId, action: "MFA_DISABLED", target: userId } });
  return { ok: true };
}
