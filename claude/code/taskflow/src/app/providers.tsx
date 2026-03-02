"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCClient } from "@trpc/client";
import superjson from "superjson";
import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "@/lib/trpc/client";
import { makeQueryClient } from "@/lib/trpc/query-client";
import type { AppRouter } from "@/server/trpc/root";

let browserQueryClient: ReturnType<typeof makeQueryClient> | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  })();
  return `${base}/api/trpc`;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: getUrl(),
          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
          {children}
        </TRPCProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
