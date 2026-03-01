import { authRouter } from "@/server/api/routers/auth";
import { createTRPCRouter } from "@/server/api/trpc";
import { joinRequestRouter } from "@/server/api/routers/joinRequest";
import { organizationRouter } from "@/server/api/routers/organization";
import { taskRouter } from "@/server/api/routers/task";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  organization: organizationRouter,
  joinRequest: joinRequestRouter,
  task: taskRouter,
});

export type AppRouter = typeof appRouter;
