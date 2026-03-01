import { env } from "@/lib/env";

export function getRequestIdFromHeaders(headers: Headers): string {
  return headers.get("x-request-id") ?? "unknown-request";
}

export function assertRequestBodyLimit(headers: Headers): void {
  const contentLengthHeader = headers.get("content-length");
  if (!contentLengthHeader) {
    return;
  }

  const contentLength = Number(contentLengthHeader);
  if (Number.isNaN(contentLength)) {
    return;
  }

  if (contentLength > env.MAX_BODY_SIZE_BYTES) {
    throw new Error("REQUEST_BODY_TOO_LARGE");
  }
}
