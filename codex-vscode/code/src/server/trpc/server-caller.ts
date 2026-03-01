import { appRouter } from "@/server/trpc/routers/_app";
import { createTRPCContext } from "@/server/trpc/context";

export async function createServerCaller() {
  const ctx = await createTRPCContext({ headers: new Headers() });
  return appRouter.createCaller(ctx);
}
