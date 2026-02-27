import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginInputSchema } from "@/lib/validation";
import { prisma } from "@/server/db";
import { logger } from "@/server/logging/logger";
import { createServices } from "@/server/services";

const authServices = createServices(prisma).auth;
const authSecret = process.env.NEXTAUTH_SECRET;
const isProductionRuntime =
  process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build";

if (isProductionRuntime) {
  if (authSecret === undefined || authSecret.length < 32) {
    throw new Error(
      "NEXTAUTH_SECRET must be set to a strong value (at least 32 characters) in production.",
    );
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  ...(authSecret !== undefined ? { secret: authSecret } : {}),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const parsed = loginInputSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        let authenticatedUser: Awaited<
          ReturnType<typeof authServices.authenticateWithPassword>
        >;

        try {
          authenticatedUser = await authServices.authenticateWithPassword(parsed.data);
        } catch (error: unknown) {
          logger.error("Credential authorization failed unexpectedly.", {
            scope: "auth.credentials.authorize",
            error,
          });
          return null;
        }

        if (authenticatedUser === null) {
          return null;
        }

        return {
          id: authenticatedUser.id,
          email: authenticatedUser.email,
          name: authenticatedUser.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id !== undefined) {
        token.userId = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      const userId = token.userId ?? token.sub;
      const membership =
        userId !== undefined ? await authServices.getSessionMembership(userId) : null;

      if (userId === undefined || session.user.email === undefined || session.user.email === null) {
        return session;
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: userId,
          name: session.user.name ?? null,
          email: session.user.email,
          organizationId: membership?.organizationId ?? null,
          role: membership?.role ?? null,
        },
      };
    },
  },
};
