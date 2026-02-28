import { QueryClient } from "@tanstack/react-query";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
      },
    },
  });
}

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return createQueryClient();
  }

  const globalForQuery = globalThis as unknown as {
    queryClient: QueryClient | undefined;
  };

  if (globalForQuery.queryClient === undefined) {
    globalForQuery.queryClient = createQueryClient();
  }

  return globalForQuery.queryClient;
}
