import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPrisma, type MockPrisma } from "./prisma-mock";

let mockPrisma: MockPrisma;

vi.mock("@/server/db", () => ({
  get prisma() {
    return mockPrisma;
  },
}));

import {
  createOrganization,
  getOrganization,
} from "@/server/services/org.service";

describe("org.service", () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma();
    vi.clearAllMocks();
  });

  describe("createOrganization", () => {
    it("creates org and sets user as OWNER", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        organizationId: null,
      });
      mockPrisma.organization.create.mockResolvedValue({
        id: "org-1",
        name: "Acme Corp",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await createOrganization("user-1", "Acme Corp");

      expect(result.id).toBe("org-1");
      expect(result.name).toBe("Acme Corp");

      expect(mockPrisma.$transaction).toHaveBeenCalledOnce();

      const updateCall = mockPrisma.user.update.mock.calls[0]![0] as {
        data: { role: string; organizationId: string };
      };
      expect(updateCall.data.role).toBe("OWNER");
      expect(updateCall.data.organizationId).toBe("org-1");
    });

    it("throws if user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        createOrganization("missing", "Org"),
      ).rejects.toThrow("User not found");
    });

    it("throws if user already has an organization", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        organizationId: "existing-org",
      });

      await expect(
        createOrganization("user-1", "New Org"),
      ).rejects.toThrow("You already belong to an organization");
    });
  });

  describe("getOrganization", () => {
    it("throws if org not found", async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(getOrganization("missing-org")).rejects.toThrow(
        "Organization not found",
      );
    });
  });
});
