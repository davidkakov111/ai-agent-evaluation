import "server-only";
import { createCaller } from "@/server/trpc/root";
import { createTRPCContext } from "@/server/trpc/init";
import { cache } from "react";

export const api = cache(async () => {
  const ctx = await createTRPCContext();
  return createCaller(ctx);
});
