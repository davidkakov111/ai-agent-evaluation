import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getRequestIdFromHeaders } from "@/lib/request";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const handler = (request: Request) => {
  const requestId = getRequestIdFromHeaders(request.headers);
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isNaN(contentLength) && contentLength > env.MAX_BODY_SIZE_BYTES) {
      logger.warn("api.trpc.body_too_large", { requestId, contentLength });
      return new Response(
        JSON.stringify({ error: "Request body too large." }),
        { status: 413, headers: { "content-type": "application/json" } },
      );
    }
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: request.headers }),
    onError({ error, path }) {
      logger.error("api.trpc.error", { requestId, path: path ?? "<unknown>", code: error.code });
    },
  });
};

export { handler as GET, handler as POST };
