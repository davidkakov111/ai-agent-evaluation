import { z } from "zod";
import { entityIdSchema } from "./common";

const organizationSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createOrganizationInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(64)
    .regex(
      organizationSlugPattern,
      "Slug can use lowercase letters, numbers, and single dashes between words.",
    ),
});

export const requestJoinOrganizationInputSchema = z.object({
  organizationId: entityIdSchema,
});

export const approveJoinRequestInputSchema = z.object({
  joinRequestId: entityIdSchema,
  role: z.enum(["OWNER", "ADMIN", "EMPLOYEE"]),
});

export const rejectJoinRequestInputSchema = z.object({
  joinRequestId: entityIdSchema,
});

export type CreateOrganizationInput = z.infer<
  typeof createOrganizationInputSchema
>;
export type RequestJoinOrganizationInput = z.infer<
  typeof requestJoinOrganizationInputSchema
>;
export type ApproveJoinRequestInput = z.infer<
  typeof approveJoinRequestInputSchema
>;
export type RejectJoinRequestInput = z.infer<
  typeof rejectJoinRequestInputSchema
>;
