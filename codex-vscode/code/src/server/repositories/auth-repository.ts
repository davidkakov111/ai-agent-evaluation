import type { PrismaClient } from "@prisma/client";

interface CreateUserInput {
  email: string;
  name: string;
  passwordHash: string;
}

export class AuthRepository {
  public constructor(private readonly db: PrismaClient) {}

  public createUser(input: CreateUserInput) {
    return this.db.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: input.passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

  public findUserByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });
  }

  public findMembershipByUserId(userId: string) {
    return this.db.membership.findUnique({
      where: { userId },
      select: {
        organizationId: true,
        role: true,
      },
    });
  }
}
