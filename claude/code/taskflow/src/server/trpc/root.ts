import { router, createCallerFactory } from "./init";
import { authRouter } from "./routers/auth";
import { orgRouter } from "./routers/org";
import { joinRequestRouter } from "./routers/join-request";
import { taskRouter } from "./routers/task";

export const appRouter = router({
  auth: authRouter,
  org: orgRouter,
  joinRequest: joinRequestRouter,
  task: taskRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
