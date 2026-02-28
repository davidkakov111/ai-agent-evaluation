import { getAuthSession } from "@/server/auth/session";
import { createServices } from "@/server/services";

export async function createTRPCContext(options: { headers: Headers }) {
  const session = await getAuthSession();
  const services = createServices();

  return {
    headers: options.headers,
    session,
    services,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
