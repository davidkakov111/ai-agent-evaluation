"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { useMemo, type ReactNode } from "react";
import { trpc, getTrpcUrl } from "@/lib/trpc/client";
import { getQueryClient } from "@/lib/trpc/query-client";

interface Props {
  children: ReactNode;
}

export function TRPCProvider({ children }: Props) {
  const queryClient = getQueryClient();
  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: getTrpcUrl(),
            transformer: superjson,
          }),
        ],
      }),
    [],
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
