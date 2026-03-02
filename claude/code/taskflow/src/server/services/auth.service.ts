import bcrypt from "bcryptjs";
import { prisma } from "@/server/db";
import type { RegisterInput } from "@/lib/validators/auth";

const SALT_ROUNDS = 12;

const DUMMY_HASH =
  "$2a$12$LJ3m4ys3Lz0YPOmPiKz1zuOJKMRKMmKOoMSHxjeSaNqNSQd1ItZW";

export async function registerUser(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  try {
    return await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      throw new Error("A user with this email already exists");
    }
    throw error;
  }
}

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always run bcrypt.compare to prevent timing-based user enumeration
  const isValid = await bcrypt.compare(
    password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  if (!user || !isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
  };
}
