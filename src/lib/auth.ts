import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isLockedOut, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";

class LockedOutError extends CredentialsSignin {
  code = "locked_out";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.toLowerCase().trim();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const lockStatus = isLockedOut(email);
        if (lockStatus.locked) {
          throw new LockedOutError();
        }

        const user = await prisma.user.findFirst({
          where: { email, status: { not: "DISABLED" } },
          include: { tenant: true },
        });

        const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

        if (!user || !valid) {
          const result = recordFailedAttempt(email);
          if (user) {
            await prisma.auditLog.create({
              data: {
                tenantId: user.tenantId,
                actorId: user.id,
                action: result.locked ? "LOGIN_LOCKED_OUT" : "LOGIN_FAILED",
                target: user.id,
                outcome: "FAILURE",
              },
            });
          }
          if (result.locked) throw new LockedOutError();
          return null;
        }

        clearAttempts(email);

        await prisma.auditLog.create({
          data: {
            tenantId: user.tenantId,
            actorId: user.id,
            action: "LOGIN",
            target: user.id,
            outcome: "SUCCESS",
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.tenantName = (user as any).tenantName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).tenantName = token.tenantName;
      }
      return session;
    },
  },
});
