import { z } from "zod";
import {
  createOrganizationInputSchema,
  requestJoinOrganizationInputSchema,
} from "@/lib/validation";
import {
  createTRPCRouter,
  ownerAdminProcedure,
  protectedProcedure,
  publicProcedure,
} from "@/server/trpc/trpc";

const sortOrderSchema = z.enum(["asc", "desc"]);
const paginationInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

const paginatedPageInfoSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  hasNextPage: z.boolean(),
});

const organizationSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

const createdOrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdById: z.string(),
  createdAt: z.string().datetime(),
});

const memberSummarySchema = z.object({
  userId: z.string(),
  organizationId: z.string(),
  role: z.enum(["OWNER", "ADMIN", "EMPLOYEE"]),
  createdAt: z.string().datetime(),
  user: z.object({
    email: z.string().email(),
    name: z.string(),
  }),
});

const joinRequestSummarySchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  requestedRole: z.enum(["OWNER", "ADMIN", "EMPLOYEE"]),
  createdAt: z.string().datetime(),
});

export const organizationRouter = createTRPCRouter({
  listPublic: publicProcedure
    .input(
      paginationInputSchema
        .extend({
          sortBy: z.enum(["name", "createdAt"]).default("name"),
          sortOrder: sortOrderSchema.default("asc"),
        })
        .optional(),
    )
    .output(
      z.object({
        items: z.array(organizationSummarySchema),
        pageInfo: paginatedPageInfoSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const sortBy = input?.sortBy ?? "name";
      const sortOrder = input?.sortOrder ?? "asc";
      const offset = (page - 1) * pageSize;
      const take = pageSize + 1;

      const organizations =
        await ctx.services.organization.listDiscoverableOrganizations({
          offset,
          limit: take,
          sortBy,
          sortOrder,
        });

      const hasNextPage = organizations.length > pageSize;
      const items = hasNextPage ? organizations.slice(0, pageSize) : organizations;

      return {
        items,
        pageInfo: {
          page,
          pageSize,
          hasNextPage,
        },
      };
    }),

  create: protectedProcedure
    .input(createOrganizationInputSchema)
    .output(createdOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      const organization =
        await ctx.services.organization.createOrganization(input, ctx.user);

      return {
        ...organization,
        createdAt: organization.createdAt.toISOString(),
      };
    }),

  requestJoin: protectedProcedure
    .input(requestJoinOrganizationInputSchema)
    .output(joinRequestSummarySchema)
    .mutation(async ({ ctx, input }) => {
      const joinRequest =
        await ctx.services.organization.requestToJoinOrganization(
          input,
          ctx.user,
        );

      return {
        ...joinRequest,
        createdAt: joinRequest.createdAt.toISOString(),
      };
    }),

  members: ownerAdminProcedure
    .input(
      paginationInputSchema
        .extend({
          role: z.enum(["OWNER", "ADMIN", "EMPLOYEE"]).optional(),
          sortOrder: sortOrderSchema.default("asc"),
        })
        .optional(),
    )
    .output(
      z.object({
        items: z.array(memberSummarySchema),
        pageInfo: paginatedPageInfoSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const role = input?.role;
      const sortOrder = input?.sortOrder ?? "asc";
      const offset = (page - 1) * pageSize;
      const take = pageSize + 1;

      const members =
        await ctx.services.organization.listOrganizationMembers(ctx.user, {
          offset,
          limit: take,
          ...(role !== undefined ? { role } : {}),
          sortOrder,
        });

      const hasNextPage = members.length > pageSize;
      const items = (hasNextPage ? members.slice(0, pageSize) : members).map(
        (member) => ({
          ...member,
          createdAt: member.createdAt.toISOString(),
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
});
