import { TRPCError } from "@trpc/server";
import {
  router,
  orgMemberProcedure,
  orgAdminProcedure,
} from "@/server/trpc/init";
import {
  createTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
  getTaskSchema,
} from "@/lib/validators/task";
import {
  createTask,
  updateTaskStatus,
  assignTask,
  listTasks,
  getTask,
} from "@/server/services/task.service";

function mapServiceError(error: unknown): never {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";
  if (message.includes("not found")) {
    throw new TRPCError({ code: "NOT_FOUND", message });
  }
  if (
    message.includes("does not belong") ||
    message.includes("do not have access") ||
    message.includes("can only update")
  ) {
    throw new TRPCError({ code: "FORBIDDEN", message });
  }
  if (
    message.includes("must belong to the same") ||
    message.includes("Invalid task status")
  ) {
    throw new TRPCError({ code: "BAD_REQUEST", message });
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
}

export const taskRouter = router({
  create: orgAdminProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await createTask({
          title: input.title,
          description: input.description,
          assigneeId: input.assigneeId,
          creatorId: ctx.session.user.id,
          organizationId: ctx.session.user.organizationId,
        });
      } catch (error) {
        mapServiceError(error);
      }
    }),

  list: orgMemberProcedure.query(async ({ ctx }) => {
    return listTasks(
      ctx.session.user.organizationId,
      ctx.session.user.id,
      ctx.session.user.role,
    );
  }),

  get: orgMemberProcedure
    .input(getTaskSchema)
    .query(async ({ ctx, input }) => {
      try {
        return await getTask(
          input.taskId,
          ctx.session.user.id,
          ctx.session.user.role,
          ctx.session.user.organizationId,
        );
      } catch (error) {
        mapServiceError(error);
      }
    }),

  updateStatus: orgMemberProcedure
    .input(updateTaskStatusSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await updateTaskStatus(
          input.taskId,
          ctx.session.user.id,
          ctx.session.user.role,
          ctx.session.user.organizationId,
          input.status,
        );
      } catch (error) {
        mapServiceError(error);
      }
    }),

  assign: orgAdminProcedure
    .input(assignTaskSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await assignTask(
          input.taskId,
          input.assigneeId,
          ctx.session.user.organizationId,
        );
      } catch (error) {
        mapServiceError(error);
      }
    }),
});
