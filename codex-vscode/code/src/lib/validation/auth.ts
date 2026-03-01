import { z } from "zod";
import { emailSchema, nameSchema, passwordSchema } from "./common";

const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

export const registerInputSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema.regex(
    passwordPolicyRegex,
    "Password must include uppercase, lowercase, and numeric characters.",
  ),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
