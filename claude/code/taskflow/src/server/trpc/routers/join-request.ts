import { TRPCError } from "@trpc/server";
import {
  router,
  protectedProcedure,
  orgAdminProcedure,
} from "@/server/trpc/init";
import {
  createJoinRequestSchema,
  reviewJoinRequestSchema,
} from "@/lib/validators/join-request";
import {
  createJoinRequest,
  reviewJoinRequest,
  getPendingRequests,
  getUserRequests,
} from "@/server/services/join-request.service";
import type { MemberRole } from "@/lib/constants";

export const joinRequestRouter = router({
  create: protectedProcedure
    .input(createJoinRequestSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await createJoinRequest(
          ctx.session.user.id,
          input.organizationId,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create request";
        if (
          message.includes("already belong") ||
          message.includes("already have a pending") ||
          message.includes("already been approved")
        ) {
          throw new TRPCError({ code: "CONFLICT", message });
        }
        if (message.includes("not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create request",
        });
      }
    }),

  review: orgAdminProcedure
    .input(reviewJoinRequestSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await reviewJoinRequest(
          input.requestId,
          ctx.session.user.id,
          ctx.session.user.organizationId,
          input.action,
          input.role as MemberRole | undefined,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to review request";
        if (message.includes("not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message });
        }
        if (
          message.includes("does not belong") ||
          message.includes("Cannot assign OWNER")
        ) {
          throw new TRPCError({ code: "FORBIDDEN", message });
        }
        if (
          message.includes("already been processed") ||
          message.includes("already belongs") ||
          message.includes("Invalid role")
        ) {
          throw new TRPCError({ code: "CONFLICT", message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to review request",
        });
      }
    }),

  listPending: orgAdminProcedure.query(async ({ ctx }) => {
    return getPendingRequests(ctx.session.user.organizationId);
  }),

  myRequests: protectedProcedure.query(async ({ ctx }) => {
    return getUserRequests(ctx.session.user.id);
  }),
});
