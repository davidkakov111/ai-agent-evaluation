import type { PrismaClient } from "@prisma/client";
import { InternalDomainError } from "@/server/errors";

export class SystemRepository {
  public constructor(private readonly db: PrismaClient) {}

  public async pingDatabase(): Promise<void> {
    try {
      await this.db.$queryRaw`SELECT 1`;
    } catch (error: unknown) {
      const cause = error instanceof Error ? error : undefined;

      throw new InternalDomainError("Database ping failed.", {
        ...(cause !== undefined ? { cause } : {}),
      });
    }
  }
}
