import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials } from "@/server/services/auth.service";
import { prisma } from "@/server/db";
import type { MemberRole } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    role?: MemberRole | null;
    organizationId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: MemberRole | null;
      organizationId: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  logger: {
    error: (error) => {
      if (!(error instanceof Error && error.name === "CredentialsSignin")) {
        console.error("[auth][error]", error);
      }
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await verifyCredentials(email, password);
        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as MemberRole | null,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role ?? null;
        token.organizationId = user.organizationId ?? null;
      }

      if (trigger === "update" && typeof token.id === "string") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, organizationId: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.organizationId = dbUser.organizationId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;

      const dbUser = typeof token.id === "string"
        ? await prisma.user.findUnique({
            where: { id: token.id },
            select: { role: true, organizationId: true },
          })
        : null;

      session.user.role = (dbUser?.role as MemberRole) ?? null;
      session.user.organizationId = dbUser?.organizationId ?? null;
      return session;
    },
  },
});
