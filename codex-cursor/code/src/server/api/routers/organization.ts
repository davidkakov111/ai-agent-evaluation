import { z } from "zod";

import { withTrpcErrorHandling } from "@/server/api/errorMapper";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { organizationService } from "@/server/services/organizationService";

const cuidSchema = z.string().regex(/^[cC][^\s-]{8,}$/, "Invalid cuid");

const createOrganizationInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
});

const createOrganizationOutputSchema = z.object({
  organization: z.object({
    id: cuidSchema,
    name: z.string(),
    slug: z.string(),
    createdById: cuidSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
  membership: z.object({
    id: cuidSchema,
    userId: cuidSchema,
    organizationId: cuidSchema,
    role: z.enum(["OWNER", "ADMIN", "EMPLOYEE"]),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export const organizationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createOrganizationInputSchema)
    .output(createOrganizationOutputSchema)
    .mutation(async ({ ctx, input }) =>
      withTrpcErrorHandling(async () =>
        organizationService.createOrganization({
          actorUserId: ctx.session.user.id,
          name: input.name,
          slug: input.slug,
        }, ctx.prisma),
      ),
    ),
});
