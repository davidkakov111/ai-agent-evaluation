import { z } from "zod";

export const createOrgSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Organization name is required" })
    .max(100, { error: "Organization name must be 100 characters or less" }),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
