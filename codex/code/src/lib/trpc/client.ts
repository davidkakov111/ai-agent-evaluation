"use client";

import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/trpc";

let browserClient: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null = null;

function resolveBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

export function getBrowserTrpcClient() {
  if (browserClient !== null) {
    return browserClient;
  }

  browserClient = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${resolveBaseUrl()}/api/trpc`,
      }),
    ],
  });

  return browserClient;
}
