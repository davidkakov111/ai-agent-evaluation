import { JoinRequestStatus, OrgRole } from "@prisma/client";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { withTrpcErrorHandling } from "@/server/api/errorMapper";
import { createTRPCRouter, protectedProcedure, roleProcedure } from "@/server/api/trpc";
import { ForbiddenError } from "@/server/services/errors";
import { joinRequestService } from "@/server/services/joinRequestService";

const createJoinRequestInputSchema = z.object({
  organizationId: z.string().cuid(),
  requestedRole: z
    .nativeEnum(OrgRole)
    .optional()
    .default(OrgRole.EMPLOYEE),
});

const joinRequestOutputSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  organizationId: z.string().cuid(),
  requestedRole: z.nativeEnum(OrgRole),
  status: z.nativeEnum(JoinRequestStatus),
  decidedById: z.string().cuid().nullable(),
  decidedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const decideJoinRequestInputSchema = z.object({
  joinRequestId: z.string().cuid(),
  assignedRole: z.nativeEnum(OrgRole).optional(),
});

export const joinRequestRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createJoinRequestInputSchema)
    .output(joinRequestOutputSchema)
    .mutation(async ({ ctx, input }) =>
      withTrpcErrorHandling(async () => {
        const result = await joinRequestService.createJoinRequest({
          userId: ctx.session.user.id,
          organizationId: input.organizationId,
          requestedRole: input.requestedRole,
        }, ctx.prisma);
        logger.info("api.join_request.create.success", {
          requestId: ctx.requestId,
          actorUserId: ctx.session.user.id,
          joinRequestId: result.id,
          organizationId: result.organizationId,
        });
        return result;
      }),
    ),

  list: protectedProcedure
    .input(z.object({}).optional())
    .output(z.array(joinRequestOutputSchema))
    .query(async ({ ctx }) =>
      withTrpcErrorHandling(async () =>
        joinRequestService.listJoinRequests({ actorUserId: ctx.session.user.id }, ctx.prisma),
      ),
    ),

  approve: roleProcedure(["OWNER", "ADMIN"] as const)
    .input(decideJoinRequestInputSchema)
    .output(joinRequestOutputSchema)
    .mutation(async ({ ctx, input }) =>
      withTrpcErrorHandling(async () => {
        if (!ctx.session.user.organizationId) {
          throw new ForbiddenError("User is not assigned to an organization.");
        }

        const result = await joinRequestService.decideJoinRequest({
          actorUserId: ctx.session.user.id,
          joinRequestId: input.joinRequestId,
          decision: JoinRequestStatus.APPROVED,
          assignedRole: input.assignedRole,
        }, ctx.prisma);
        logger.info("api.join_request.approve.success", {
          requestId: ctx.requestId,
          actorUserId: ctx.session.user.id,
          joinRequestId: result.id,
        });
        return result;
      }),
    ),

  reject: roleProcedure(["OWNER", "ADMIN"] as const)
    .input(z.object({ joinRequestId: z.string().cuid() }))
    .output(joinRequestOutputSchema)
    .mutation(async ({ ctx, input }) =>
      withTrpcErrorHandling(async () => {
        if (!ctx.session.user.organizationId) {
          throw new ForbiddenError("User is not assigned to an organization.");
        }

        const result = await joinRequestService.decideJoinRequest({
          actorUserId: ctx.session.user.id,
          joinRequestId: input.joinRequestId,
          decision: JoinRequestStatus.REJECTED,
        }, ctx.prisma);
        logger.info("api.join_request.reject.success", {
          requestId: ctx.requestId,
          actorUserId: ctx.session.user.id,
          joinRequestId: result.id,
        });
        return result;
      }),
    ),
});
