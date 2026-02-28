import { z } from "zod";
import {
  approveJoinRequestInputSchema,
  rejectJoinRequestInputSchema,
} from "@/lib/validation";
import { createTRPCRouter, ownerAdminProcedure } from "@/server/trpc/trpc";

const sortOrderSchema = z.enum(["asc", "desc"]);
const paginationInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortOrder: sortOrderSchema.default("asc"),
});

const paginatedPageInfoSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  hasNextPage: z.boolean(),
});

const pendingJoinRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  status: z.literal("PENDING"),
  requestedRole: z.enum(["OWNER", "ADMIN", "EMPLOYEE"]),
  createdAt: z.string().datetime(),
  user: z.object({
    email: z.string().email(),
    name: z.string(),
  }),
});

const mutationResultSchema = z.object({
  success: z.literal(true),
});

export const joinRequestRouter = createTRPCRouter({
  listPending: ownerAdminProcedure
    .input(paginationInputSchema.optional())
    .output(
      z.object({
        items: z.array(pendingJoinRequestSchema),
        pageInfo: paginatedPageInfoSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const sortOrder = input?.sortOrder ?? "asc";
      const offset = (page - 1) * pageSize;
      const take = pageSize + 1;

      const pending =
        await ctx.services.organization.listPendingJoinRequests(ctx.user, {
          offset,
          limit: take,
          sortOrder,
        });

      const hasNextPage = pending.length > pageSize;
      const items = (hasNextPage ? pending.slice(0, pageSize) : pending).map(
        (item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        }),
      );

      return {
        items,
        pageInfo: {
          page,
          pageSize,
          hasNextPage,
        },
      };
    }),

  approve: ownerAdminProcedure
    .input(approveJoinRequestInputSchema)
    .output(mutationResultSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.services.organization.approveJoinRequest(input, ctx.user);

      return {
        success: true as const,
      };
    }),

  reject: ownerAdminProcedure
    .input(rejectJoinRequestInputSchema)
    .output(mutationResultSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.services.organization.rejectJoinRequest(input, ctx.user);

      return {
        success: true as const,
      };
    }),
});
