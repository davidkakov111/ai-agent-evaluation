import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { assertRequestBodyLimit, getRequestIdFromHeaders } from "@/lib/request";
import { prisma } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { registrationSchema } from "@/server/auth/schemas";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  const requestId = getRequestIdFromHeaders(request.headers);
  let body: unknown;

  try {
    assertRequestBodyLimit(request.headers);
    body = await request.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "REQUEST_BODY_TOO_LARGE") {
      logger.warn("auth.register.request_too_large", { requestId });
      return NextResponse.json(
        { error: "Request body too large." },
        { status: 413 },
      );
    }

    logger.warn("auth.register.invalid_request_body", { requestId });
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn("auth.register.validation_failed", { requestId });
    return NextResponse.json(
      { error: "Invalid registration payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, name, password } = parsed.data;

  try {
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash: await hashPassword(password),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    logger.info("auth.register.success", { requestId, userId: user.id });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      logger.warn("auth.register.conflict", { requestId });
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 },
      );
    }

    logger.error("auth.register.failed", { requestId });
    return NextResponse.json(
      { error: "Could not register user at this time." },
      { status: 500 },
    );
  }
}
