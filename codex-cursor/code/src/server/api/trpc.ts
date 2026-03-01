import { initTRPC, TRPCError } from "@trpc/server";
import { OrgRole } from "@prisma/client";
import superjson from "superjson";

import { getRequestIdFromHeaders } from "@/lib/request";
import {
  requireAuth,
  requireOrgMember,
  requireRole,
} from "@/server/auth/policies";
import { getAuthSession } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { ForbiddenError } from "@/server/services/errors";

export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await getAuthSession();
  const requestId = getRequestIdFromHeaders(opts.headers);

  return {
    headers: opts.headers,
    requestId,
    prisma,
    session,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  const session = ctx.session;
  if (!session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  }

  let user;
  try {
    user = requireAuth(session);
  } catch {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          organizationId: user.organizationId,
          role: user.role,
        },
      },
    },
  });
});

export const orgMemberProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const organizationId = ctx.session.user.organizationId;
  if (!organizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "User is not assigned to an organization.",
    });
  }

  try {
    await requireOrgMember(ctx.prisma, {
      userId: ctx.session.user.id,
      organizationId,
    });
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: error.message,
      });
    }

    throw error;
  }

  return next();
});

export function roleProcedure(allowedRoles: readonly OrgRole[]) {
  return orgMemberProcedure.use(({ ctx, next }) => {
    const role = ctx.session.user.role;
    if (!role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User role not found.",
      });
    }

    try {
      requireRole(role, allowedRoles);
    } catch (error: unknown) {
      if (error instanceof ForbiddenError) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: error.message,
        });
      }

      throw error;
    }

    return next();
  });
}
