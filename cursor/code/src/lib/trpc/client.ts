"use client";

import { createTRPCReact } from "@trpc/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/trpc";

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export const trpc = createTRPCReact<AppRouter>();

export function getTrpcUrl(): string {
  return `${getBaseUrl()}/api/trpc`;
}

let browserClient: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null =
  null;

export function getBrowserTrpcClient() {
  if (browserClient !== null) {
    return browserClient;
  }

  browserClient = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: getTrpcUrl(),
        transformer: superjson,
      }),
    ],
  });

  return browserClient;
}
