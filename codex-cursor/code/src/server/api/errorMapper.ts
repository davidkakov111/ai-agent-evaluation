import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ZodError } from "zod";

import { DomainError } from "@/server/services/errors";

function domainCodeToTrpcCode(code: string): TRPCError["code"] {
  switch (code) {
    case "VALIDATION_ERROR":
      return "BAD_REQUEST";
    case "FORBIDDEN":
      return "FORBIDDEN";
    case "NOT_FOUND":
      return "NOT_FOUND";
    case "CONFLICT":
      return "CONFLICT";
    case "INVALID_TRANSITION":
      return "PRECONDITION_FAILED";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}

export function mapToTRPCError(error: unknown): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof DomainError) {
    return new TRPCError({
      code: domainCodeToTrpcCode(error.code),
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof ZodError) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid request payload.",
      cause: error,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return new TRPCError({
        code: "CONFLICT",
        message: "Record already exists.",
        cause: error,
      });
    }

    return new TRPCError({
      code: "BAD_REQUEST",
      message: "Database operation failed.",
      cause: error,
    });
  }

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Unexpected server error.",
    cause: error,
  });
}

export async function withTrpcErrorHandling<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    throw mapToTRPCError(error);
  }
}
