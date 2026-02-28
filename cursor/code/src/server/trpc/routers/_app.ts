import { authRouter } from "@/server/trpc/routers/auth";
import { healthRouter } from "@/server/trpc/routers/health";
import { joinRequestRouter } from "@/server/trpc/routers/join-request";
import { organizationRouter } from "@/server/trpc/routers/organization";
import { taskRouter } from "@/server/trpc/routers/task";
import { createTRPCRouter } from "@/server/trpc/trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  health: healthRouter,
  joinRequest: joinRequestRouter,
  organization: organizationRouter,
  task: taskRouter,
});

export type AppRouter = typeof appRouter;
