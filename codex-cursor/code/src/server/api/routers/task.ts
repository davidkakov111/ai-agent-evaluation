import { TaskStatus } from "@prisma/client";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { withTrpcErrorHandling } from "@/server/api/errorMapper";
import { createTRPCRouter, orgMemberProcedure, roleProcedure } from "@/server/api/trpc";
import { ForbiddenError } from "@/server/services/errors";
import { taskService } from "@/server/services/taskService";

const taskOutputSchema = z.object({
  id: z.string().cuid(),
  organizationId: z.string().cuid(),
  createdById: z.string().cuid(),
  assignedToId: z.string().cuid(),
  title: z.string(),
  description: z.string(),
  status: z.nativeEnum(TaskStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const createTaskInputSchema = z.object({
  assignedToId: z.string().cuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  status: z.nativeEnum(TaskStatus).optional(),
});

const assignTaskInputSchema = z.object({
  taskId: z.string().cuid(),
  assignedToId: z.string().cuid(),
});

const updateTaskStatusInputSchema = z.object({
  taskId: z.string().cuid(),
  status: z.nativeEnum(TaskStatus),
});

export const taskRouter = createTRPCRouter({
  create: roleProcedure(["OWNER", "ADMIN"] as const)
    .input(createTaskInputSchema)
    .output(taskOutputSchema)
    .mutation(async ({ ctx, input }) =>
      withTrpcErrorHandling(async () => {
        const organizationId = ctx.session.user.organizationId;
        if (!organizationId) {
          throw new ForbiddenError("User is not assigned to an organization.");
        }

        const result = await taskService.createTask({
          actorUserId: ctx.session.user.id,
          organizationId,
          assignedToId: input.assignedToId,
          title: input.title,
          description: input.description,
          status: input.status,
        }, ctx.prisma);
        logger.info("api.task.create.success", {
          requestId: ctx.requestId,
          actorUserId: ctx.session.user.id,
          taskId: result.id,
          organizationId: result.organizationId,
        });
        return result;
      }),
    ),

  assign: roleProcedure(["OWNER", "ADMIN"] as const)
    .input(assignTaskInputSchema)
    .output(taskOutputSchema)
    .mutation(async ({ ctx, input }) =>
      withTrpcErrorHandling(async () => {
        const result = await taskService.assignTask({
          actorUserId: ctx.session.user.id,
          taskId: input.taskId,
          assignedToId: input.assignedToId,
        }, ctx.prisma);
        logger.info("api.task.assign.success", {
          requestId: ctx.requestId,
          actorUserId: ctx.session.user.id,
          taskId: result.id,
          assignedToId: result.assignedToId,
        });
        return result;
      }),
    ),

  list: orgMemberProcedure
    .input(z.object({}).optional())
    .output(z.array(taskOutputSchema))
    .query(async ({ ctx }) =>
      withTrpcErrorHandling(async () => {
        const organizationId = ctx.session.user.organizationId;
        if (!organizationId) {
          throw new ForbiddenError("User is not assigned to an organization.");
        }

        return taskService.listVisibleTasks({
          actorUserId: ctx.session.user.id,
          organizationId,
        }, ctx.prisma);
      }),
    ),

  updateStatus: orgMemberProcedure
    .input(updateTaskStatusInputSchema)
    .output(taskOutputSchema)
    .mutation(async ({ ctx, input }) =>
      withTrpcErrorHandling(async () => {
        const result = await taskService.updateTaskStatus({
          actorUserId: ctx.session.user.id,
          taskId: input.taskId,
          status: input.status,
        }, ctx.prisma);
        logger.info("api.task.status.success", {
          requestId: ctx.requestId,
          actorUserId: ctx.session.user.id,
          taskId: result.id,
          status: result.status,
        });
        return result;
      }),
    ),
});
