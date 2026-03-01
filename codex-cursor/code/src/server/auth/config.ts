import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { OrgRole } from "@prisma/client";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/server/db";
import { credentialsSchema } from "@/server/auth/schemas";
import {
  verifyPassword,
  verifyPasswordAgainstDummy,
} from "@/server/auth/password";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 12,
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          logger.warn("auth.credentials.invalid_payload");
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user) {
          logger.warn("auth.credentials.user_not_found");
          await verifyPasswordAgainstDummy(password);
          return null;
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
          logger.warn("auth.credentials.invalid_password", { userId: user.id });
          return null;
        }

        logger.info("auth.credentials.success", { userId: user.id });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: null,
          role: null as OrgRole | null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub;

      if (!userId) {
        return token;
      }

      token.userId = userId;
      token.sub = userId;

      const membership = await prisma.membership.findUnique({
        where: { userId },
        select: {
          organizationId: true,
          role: true,
        },
      });

      token.organizationId = membership?.organizationId ?? null;
      token.role = membership?.role ?? null;

      return token;
    },
    async session({ session, token }) {
      if (!session.user || !token.userId) {
        return session;
      }

      session.user.id = token.userId;
      session.user.organizationId = token.organizationId ?? null;
      session.user.role = token.role ?? null;

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  ...(env.NEXTAUTH_SECRET
    ? { secret: env.NEXTAUTH_SECRET }
    : {}),
};
