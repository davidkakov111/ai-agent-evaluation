import type { Prisma } from "@prisma/client";
import type { LoginInput, RegisterInput } from "@/lib/validation";
import { AuthRepository } from "@/server/repositories";
import { ConflictDomainError, InternalDomainError } from "@/server/errors";
import { getAuthRateLimiter } from "@/server/auth/rate-limit";
import { hashPassword, verifyPassword } from "@/server/auth/password";

const DUMMY_PASSWORD_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

function isPrismaUniqueViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code === "P2002"
  );
}

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export interface SessionMembership {
  organizationId: string | null;
  role: "OWNER" | "ADMIN" | "EMPLOYEE" | null;
}

export class AuthService {
  public constructor(private readonly authRepository: AuthRepository) {}

  public async register(input: RegisterInput): Promise<RegisteredUser> {
    const normalizedEmail = input.email.trim().toLowerCase();

    await getAuthRateLimiter().consume({
      action: "register",
      identifier: normalizedEmail,
    });

    const passwordHash = await hashPassword(input.password);

    try {
      const user = await this.authRepository.createUser({
        email: normalizedEmail,
        name: input.name,
        passwordHash,
      });

      return user;
    } catch (error: unknown) {
      if (isPrismaUniqueViolation(error)) {
        throw new ConflictDomainError("Unable to register with provided details.");
      }

      throw new InternalDomainError("Unable to register user.", {
        ...(error instanceof Error ? { cause: error } : {}),
      });
    }
  }

  public async authenticateWithPassword(input: LoginInput): Promise<AuthenticatedUser | null> {
    const normalizedEmail = input.email.trim().toLowerCase();

    await getAuthRateLimiter().consume({
      action: "login",
      identifier: normalizedEmail,
    });

    const user = await this.authRepository.findUserByEmail(normalizedEmail);
    const passwordMatches = await verifyPassword(
      input.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (user === null || !passwordMatches) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  public async getSessionMembership(userId: string): Promise<SessionMembership> {
    const membership = await this.authRepository.findMembershipByUserId(userId);

    if (membership === null) {
      return {
        organizationId: null,
        role: null,
      };
    }

    return {
      organizationId: membership.organizationId,
      role: membership.role,
    };
  }
}
