import { TRPCError } from "@trpc/server";
import {
  router,
  protectedProcedure,
  orgMemberProcedure,
} from "@/server/trpc/init";
import { createOrgSchema } from "@/lib/validators/org";
import {
  createOrganization,
  getOrganization,
  getOrganizationMembers,
  listOrganizations,
} from "@/server/services/org.service";

export const orgRouter = router({
  create: protectedProcedure
    .input(createOrgSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await createOrganization(ctx.session.user.id, input.name);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create organization";
        if (message.includes("already belong")) {
          throw new TRPCError({ code: "CONFLICT", message });
        }
        if (message.includes("Unique constraint")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An organization with this name already exists",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create organization",
        });
      }
    }),

  get: orgMemberProcedure.query(async ({ ctx }) => {
    return getOrganization(ctx.session.user.organizationId);
  }),

  members: orgMemberProcedure.query(async ({ ctx }) => {
    return getOrganizationMembers(ctx.session.user.organizationId);
  }),

  list: protectedProcedure.query(async () => {
    return listOrganizations();
  }),
});
