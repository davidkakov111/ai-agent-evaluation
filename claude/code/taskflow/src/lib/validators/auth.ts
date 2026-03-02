import { z } from "zod";

export const registerSchema = z.object({
  email: z.email({ error: "Invalid email address" }),
  name: z
    .string()
    .min(1, { error: "Name is required" })
    .max(100, { error: "Name must be 100 characters or less" }),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .max(128, { error: "Password must be 128 characters or less" }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email({ error: "Invalid email address" }),
  password: z
    .string()
    .min(1, { error: "Password is required" })
    .max(128, { error: "Password must be 128 characters or less" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
