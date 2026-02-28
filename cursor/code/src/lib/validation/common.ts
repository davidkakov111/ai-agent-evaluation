import { z } from "zod";

export const entityIdSchema = z.string().trim().min(1).max(191);
export const emailSchema = z.string().trim().toLowerCase().email().max(255);
export const nameSchema = z.string().trim().min(1).max(120);
export const passwordSchema = z.string().min(8).max(72);
