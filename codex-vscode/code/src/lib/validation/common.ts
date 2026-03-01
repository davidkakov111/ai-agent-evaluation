import { z } from "zod";

export const entityIdSchema = z.string().trim().min(1).max(191);
export const emailSchema = z.string().trim().toLowerCase().email().max(255);
export const nameSchema = z.string().trim().min(1).max(120);
export const passwordSchema = z.string().min(8).max(72);

export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().trim().min(1).nullable().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
