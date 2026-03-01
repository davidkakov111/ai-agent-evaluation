import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1),
    NEXTAUTH_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32).optional(),
    MAX_BODY_SIZE_BYTES: z.coerce.number().int().positive().default(1_048_576),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === "production" && !value.NEXTAUTH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "NEXTAUTH_SECRET is required in production.",
        path: ["NEXTAUTH_SECRET"],
      });
    }
  });

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  MAX_BODY_SIZE_BYTES: process.env.MAX_BODY_SIZE_BYTES,
});
