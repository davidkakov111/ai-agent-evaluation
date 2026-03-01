import { z } from "zod";

import { hashPassword } from "@/server/auth/password";
import { registrationSchema } from "@/server/auth/schemas";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { withTrpcErrorHandling } from "@/server/api/errorMapper";

const cuidSchema = z.string().regex(/^[cC][^\s-]{8,}$/, "Invalid cuid");

const meOutputSchema = z.object({
  id: cuidSchema,
  email: z.email().nullable(),
  name: z.string().nullable(),
  organizationId: cuidSchema.nullable(),
  role: z.enum(["OWNER", "ADMIN", "EMPLOYEE"]).nullable(),
});

const registerOutputSchema = z.object({
  user: z.object({
    id: cuidSchema,
    email: z.email(),
    name: z.string(),
    createdAt: z.date(),
  }),
});

export const authRouter = createTRPCRouter({
  me: protectedProcedure.output(meOutputSchema).query(async ({ ctx }) =>
    withTrpcErrorHandling(async () => ({
      id: ctx.session.user.id,
      email: ctx.session.user.email ?? null,
      name: ctx.session.user.name ?? null,
      organizationId: ctx.session.user.organizationId,
      role: ctx.session.user.role,
    })),
  ),

  register: publicProcedure
    .input(registrationSchema)
    .output(registerOutputSchema)
    .mutation(async ({ ctx, input }) =>
      withTrpcErrorHandling(async () => {
        const user = await ctx.prisma.user.create({
          data: {
            email: input.email.toLowerCase(),
            name: input.name,
            passwordHash: await hashPassword(input.password),
          },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        });

        return { user };
      }),
    ),
});
