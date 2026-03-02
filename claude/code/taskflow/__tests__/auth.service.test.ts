import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPrisma, type MockPrisma } from "./prisma-mock";

let mockPrisma: MockPrisma;

vi.mock("@/server/db", () => ({
  get prisma() {
    return mockPrisma;
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async (password: string) => `hashed_${password}`),
    compare: vi.fn(
      async (password: string, hash: string) =>
        hash === `hashed_${password}`,
    ),
  },
}));

import { registerUser, verifyCredentials } from "@/server/services/auth.service";

describe("auth.service", () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma();
    vi.clearAllMocks();
  });

  describe("registerUser", () => {
    it("creates a user with hashed password", async () => {
      mockPrisma.user.create.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: null,
        organizationId: null,
        createdAt: new Date(),
      });

      const result = await registerUser({
        email: "test@example.com",
        name: "Test User",
        password: "securepass123",
      });

      expect(result.id).toBe("user-1");
      expect(result.email).toBe("test@example.com");

      const createCall = mockPrisma.user.create.mock.calls[0]![0] as {
        data: { passwordHash: string };
      };
      expect(createCall.data.passwordHash).toBe("hashed_securepass123");
      expect(createCall.data.passwordHash).not.toBe("securepass123");
    });

    it("throws on duplicate email (unique constraint)", async () => {
      mockPrisma.user.create.mockRejectedValue(
        new Error("Unique constraint failed on the fields: (`email`)"),
      );

      await expect(
        registerUser({
          email: "test@example.com",
          name: "Test",
          password: "pass",
        }),
      ).rejects.toThrow("A user with this email already exists");
    });
  });

  describe("verifyCredentials", () => {
    it("returns user for valid credentials", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        passwordHash: "hashed_correctpass",
        role: "OWNER",
        organizationId: "org-1",
      });

      const result = await verifyCredentials("test@example.com", "correctpass");

      expect(result).toEqual({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "OWNER",
        organizationId: "org-1",
      });
    });

    it("returns null for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await verifyCredentials("nobody@example.com", "pass");

      expect(result).toBeNull();
    });

    it("returns null for wrong password", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        passwordHash: "hashed_correctpass",
        role: null,
        organizationId: null,
      });

      const result = await verifyCredentials("test@example.com", "wrongpass");

      expect(result).toBeNull();
    });
  });
});
