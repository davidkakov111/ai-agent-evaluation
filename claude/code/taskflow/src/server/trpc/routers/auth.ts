import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "@/server/trpc/init";
import { registerSchema } from "@/lib/validators/auth";
import { registerUser } from "@/server/services/auth.service";

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      try {
        return await registerUser(input);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Registration failed";
        if (message.includes("already exists")) {
          throw new TRPCError({ code: "CONFLICT", message });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Registration failed",
        });
      }
    }),
});
