import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc/trpc";

const healthResponseSchema = z.object({
  ok: z.literal(true),
  database: z.literal("up"),
});

export const healthRouter = createTRPCRouter({
  status: publicProcedure.output(healthResponseSchema).query(async ({ ctx }) => {
    return ctx.services.system.healthcheck();
  }),
});
