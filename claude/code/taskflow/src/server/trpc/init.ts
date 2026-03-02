import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { cache } from "react";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { ADMIN_ROLES, type MemberRole } from "@/lib/constants";
import type { Session } from "next-auth";
import type { PrismaClient } from "@/generated/prisma/client";

export interface TRPCContext {
  session: Session | null;
  prisma: PrismaClient;
}

export const createTRPCContext = cache(async (): Promise<TRPCContext> => {
  const session = await auth();
  return { session, prisma };
});

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;

export const publicProcedure = t.procedure;

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      session: {
        ...ctx.session,
        user: ctx.session.user,
      },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceAuth);

const enforceOrgMembership = t.middleware(({ ctx, next }) => {
  const user = ctx.session?.user;
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!user.organizationId || !user.role) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must belong to an organization",
    });
  }

  return next({
    ctx: {
      session: {
        ...ctx.session!,
        user: {
          ...user,
          organizationId: user.organizationId,
          role: user.role as MemberRole,
        },
      },
    },
  });
});

export const orgMemberProcedure = t.procedure
  .use(enforceAuth)
  .use(enforceOrgMembership);

const enforceOrgAdmin = t.middleware(({ ctx, next }) => {
  const user = ctx.session?.user;
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!user.organizationId || !user.role) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must belong to an organization",
    });
  }

  if (!ADMIN_ROLES.includes(user.role as MemberRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only owners and admins can perform this action",
    });
  }

  return next({
    ctx: {
      session: {
        ...ctx.session!,
        user: {
          ...user,
          organizationId: user.organizationId,
          role: user.role as MemberRole,
        },
      },
    },
  });
});

export const orgAdminProcedure = t.procedure
  .use(enforceAuth)
  .use(enforceOrgAdmin);
