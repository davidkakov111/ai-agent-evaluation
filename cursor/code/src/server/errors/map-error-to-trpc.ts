import { TRPCError } from "@trpc/server";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import { logger } from "@/server/logging/logger";
import { DomainError, type DomainErrorCode } from "./domain-error";

const domainToTrpcCode: Record<DomainErrorCode, TRPC_ERROR_CODE_KEY> = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "TOO_MANY_REQUESTS",
  VALIDATION: "BAD_REQUEST",
  PRECONDITION_FAILED: "PRECONDITION_FAILED",
  INTERNAL: "INTERNAL_SERVER_ERROR",
};

export function mapErrorToTRPC(error: unknown): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof DomainError) {
    if (error.code === "RATE_LIMITED") {
      logger.warn("Rate-limited request mapped to tRPC.", {
        scope: "trpc.error-mapper",
        code: error.code,
        message: error.message,
      });
    } else if (error.code === "INTERNAL") {
      logger.error("Internal domain error mapped to tRPC.", {
        scope: "trpc.error-mapper",
        code: error.code,
        message: error.message,
      });
    }

    return new TRPCError({
      code: domainToTrpcCode[error.code],
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof Error) {
    logger.error("Unexpected error mapped to tRPC.", {
      scope: "trpc.error-mapper",
      name: error.name,
      message: error.message,
    });

    return new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
      cause: error,
    });
  }

  logger.error("Unknown non-error value mapped to tRPC.", {
    scope: "trpc.error-mapper",
    meta: {
      valueType: typeof error,
    },
  });

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred.",
  });
}
