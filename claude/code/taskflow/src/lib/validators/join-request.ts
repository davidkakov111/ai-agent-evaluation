import { z } from "zod";

export const createJoinRequestSchema = z.object({
  organizationId: z.string().min(1, { error: "Organization ID is required" }),
});

export type CreateJoinRequestInput = z.infer<typeof createJoinRequestSchema>;

export const reviewJoinRequestSchema = z
  .object({
    requestId: z.string().min(1, { error: "Request ID is required" }),
    action: z.enum(["APPROVED", "REJECTED"]),
    role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
  })
  .check(
    (ctx) => {
      if (ctx.value.action === "APPROVED" && !ctx.value.role) {
        ctx.issues.push({
          code: "custom",
          message: "Role is required when approving a request",
          path: ["role"],
          input: ctx.value,
        });
      }
    },
  );

export type ReviewJoinRequestInput = z.infer<typeof reviewJoinRequestSchema>;
