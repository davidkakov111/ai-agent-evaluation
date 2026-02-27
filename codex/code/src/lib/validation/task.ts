import { z } from "zod";
import { entityIdSchema } from "./common";

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

export const createTaskInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  assignedToUserId: entityIdSchema,
});

export const reassignTaskInputSchema = z.object({
  taskId: entityIdSchema,
  assignedToUserId: entityIdSchema,
});

export const updateTaskStatusInputSchema = z.object({
  taskId: entityIdSchema,
  status: taskStatusSchema,
});

export const listTasksInputSchema = z
  .object({
    status: taskStatusSchema.optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .optional();

export type TaskStatusInput = z.infer<typeof taskStatusSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type ReassignTaskInput = z.infer<typeof reassignTaskInputSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusInputSchema>;
export type ListTasksInput = z.infer<typeof listTasksInputSchema>;
