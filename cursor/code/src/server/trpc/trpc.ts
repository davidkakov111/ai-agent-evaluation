import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { DomainError, mapErrorToTRPC } from "@/server/errors";
import { requireAuth, requireMembership, requireOwnerOrAdminRole } from "@/server/policies";
import type { TRPCContext } from "./context";

function extractValidationMessage(rawMessage: string): string | null {
  try {
    const parsed = JSON.parse(rawMessage) as unknown;

    if (!Array.isArray(parsed)) {
      return null;
    }

    const firstIssue = parsed[0];
    if (
      typeof firstIssue === "object" &&
      firstIssue !== null &&
      "message" in firstIssue &&
      typeof (firstIssue as { message: unknown }).message === "string" &&
      (firstIssue as { message: string }).message.length > 0
    ) {
      return (firstIssue as { message: string }).message;
    }

    return null;
  } catch {
    return null;
  }
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const domainCode = error.cause instanceof DomainError ? error.cause.code : null;
    const normalizedMessage =
      shape.code === -32600
        ? (extractValidationMessage(shape.message) ?? "Invalid input.")
        : shape.message;

    return {
      ...shape,
      message: normalizedMessage,
      data: {
        ...shape.data,
        domainCode,
      },
    };
  },
});

const errorMappingMiddleware = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error: unknown) {
    throw mapErrorToTRPC(error);
  }
});

const authMiddleware = t.middleware(async ({ ctx, next }) => {
  try {
    const user = requireAuth(ctx.session?.user ?? null);

    return next({
      ctx: {
        ...ctx,
        user,
      },
    });
  } catch (error: unknown) {
    throw mapErrorToTRPC(error);
  }
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure.use(errorMappingMiddleware);
export const protectedProcedure = t.procedure
  .use(errorMappingMiddleware)
  .use(authMiddleware);
export const memberProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  try {
    const member = requireMembership(ctx.user);

    return next({
      ctx: {
        ...ctx,
        member,
      },
    });
  } catch (error: unknown) {
    throw mapErrorToTRPC(error);
  }
});
export const ownerAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  try {
    const member = requireOwnerOrAdminRole(ctx.user);

    return next({
      ctx: {
        ...ctx,
        member,
      },
    });
  } catch (error: unknown) {
    throw mapErrorToTRPC(error);
  }
});
