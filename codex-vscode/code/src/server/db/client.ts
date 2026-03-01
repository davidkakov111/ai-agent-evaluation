import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as { prisma?: PrismaClient };
const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

const adapter = new PrismaBetterSqlite3(
  {
    url: databaseUrl,
  },
  {
    // Keep Prisma 6-compatible SQLite DateTime encoding for existing data.
    timestampFormat: "unixepoch-ms",
  },
);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
