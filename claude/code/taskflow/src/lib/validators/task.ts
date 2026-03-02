import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, { error: "Title is required" })
    .max(200, { error: "Title must be 200 characters or less" }),
  description: z
    .string()
    .max(2000, { error: "Description must be 2000 characters or less" })
    .default(""),
  assigneeId: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskStatusSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
});

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

export const assignTaskSchema = z.object({
  taskId: z.string().min(1),
  assigneeId: z.string().min(1),
});

export type AssignTaskInput = z.infer<typeof assignTaskSchema>;

export const getTaskSchema = z.object({
  taskId: z.string().min(1),
});
