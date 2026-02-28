import { z } from "zod";
import {
  createTaskInputSchema,
  reassignTaskInputSchema,
  taskStatusSchema,
  updateTaskStatusInputSchema,
} from "@/lib/validation";
import {
  createTRPCRouter,
  memberProcedure,
  ownerAdminProcedure,
} from "@/server/trpc/trpc";

const taskSortFieldSchema = z.enum(["createdAt", "updatedAt", "status"]);
const sortOrderSchema = z.enum(["asc", "desc"]);

const taskSummarySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  assignedToId: z.string(),
  createdById: z.string(),
  status: taskStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const mutationResultSchema = z.object({
  success: z.literal(true),
});

const paginatedPageInfoSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  hasNextPage: z.boolean(),
});

const listTasksInputSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
    status: taskStatusSchema.optional(),
    sortBy: taskSortFieldSchema.default("createdAt"),
    sortOrder: sortOrderSchema.default("desc"),
  })
  .optional();

export const taskRouter = createTRPCRouter({
  create: ownerAdminProcedure
    .input(createTaskInputSchema)
    .output(taskSummarySchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.services.task.createTask(input, ctx.user);

      return {
        ...task,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      };
    }),

  reassign: ownerAdminProcedure
    .input(reassignTaskInputSchema)
    .output(mutationResultSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.services.task.reassignTask(input, ctx.user);

      return {
        success: true as const,
      };
    }),

  list: memberProcedure
    .input(listTasksInputSchema)
    .output(
      z.object({
        items: z.array(taskSummarySchema),
        pageInfo: paginatedPageInfoSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const sortBy = input?.sortBy ?? "createdAt";
      const sortOrder = input?.sortOrder ?? "desc";
      const offset = (page - 1) * pageSize;
      const take = pageSize + 1;

      const tasks = await ctx.services.task.listTasks(
        {
          status: input?.status,
          limit: take,
        },
        ctx.user,
        {
          offset,
          limit: take,
          sortBy,
          sortOrder,
        },
      );

      const hasNextPage = tasks.length > pageSize;
      const pageItems = hasNextPage ? tasks.slice(0, pageSize) : tasks;

      return {
        items: pageItems.map((task) => ({
          ...task,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        })),
        pageInfo: {
          page,
          pageSize,
          hasNextPage,
        },
      };
    }),

  updateStatus: memberProcedure
    .input(updateTaskStatusInputSchema)
    .output(taskSummarySchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.services.task.updateTaskStatus(input, ctx.user);

      return {
        ...task,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      };
    }),
});
