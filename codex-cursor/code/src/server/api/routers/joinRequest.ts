import { JoinRequestStatus, OrgRole } from "@prisma/client";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { withTrpcErrorHandling } from "@/server/api/errorMapper";
import { createTRPCRouter, protectedProcedure, roleProcedure } from "@/server/api/trpc";
import { ForbiddenError, NotFoundError } from "@/server/services/errors";
import { joinRequestService } from "@/server/services/joinRequestService";

const cuidSchema = z.string().regex(/^[cC][^\s-]{8,}$/, "Invalid cuid");

const createJoinRequestInputSchema = z.object({
  organizationId: cuidSchema.optional(),
  organizationSlug: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  requestedRole: z
    .enum(OrgRole)
    .optional()
    .default(OrgRole.EMPLOYEE),
}).refine(
  (value) =>
    (value.organizationId !== undefined || value.organizationSlug !== undefined) &&
    !(value.organizationId !== undefined && value.organizationSlug !== undefined),
  {
    message: "Provide either organizationId or organizationSlug.",
  },
);

const joinRequestOutputSchema = z.object({
  id: cuidSchema,
  userId: cuidSchema,
  organizationId: cuidSchema,
  requestedRole: z.enum(OrgRole),
  status: z.enum(JoinRequestStatus),
  decidedById: cuidSchema.nullable(),
  decidedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const decideJoinRequestInputSchema = z.object({
  joinRequestId: cuidSchema,
  assignedRole: z.enum(OrgRole).optional(),
});

export const joinRequestRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createJoinRequestInputSchema)
    .output(joinRequestOutputSchema)
    .mutation(async ({ ctx, input }) =>
      withTrpcErrorHandling(async () => {
        let resolvedOrganizationId: string | undefined = input.organizationId;
        if (!resolvedOrganizationId) {
          if (!input.organizationSlug) {
            throw new NotFoundError("Organization not found.");
          }

          const organization = await ctx.prisma.organization.findUnique({
            where: { slug: input.organizationSlug },
            select: { id: true },
          });
          resolvedOrganizationId = organization?.id;
        }

        if (!resolvedOrganizationId) {
          throw new NotFoundError("Organization not found.");
        }

        const result = await joinRequestService.createJoinRequest({
          userId: ctx.session.user.id,
          organizationId: resolvedOrganizationId,
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
    .input(z.object({ joinRequestId: cuidSchema }))
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
