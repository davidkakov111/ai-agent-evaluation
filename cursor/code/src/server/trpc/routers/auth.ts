import { z } from "zod";
import { registerInputSchema } from "@/lib/validation";
import { appRoles } from "@/server/auth/types";
import { createTRPCRouter, publicProcedure } from "@/server/trpc/trpc";

const registerResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

const sessionSchema = z
  .object({
    user: z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string().nullable(),
      organizationId: z.string().nullable(),
      role: z.enum(appRoles).nullable(),
    }),
  })
  .nullable();

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerInputSchema)
    .output(registerResponseSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.services.auth.register(input);

      return {
        ...user,
        createdAt: user.createdAt.toISOString(),
      };
    }),
  session: publicProcedure.output(sessionSchema).query(({ ctx }) => {
    return ctx.session;
  }),
});
