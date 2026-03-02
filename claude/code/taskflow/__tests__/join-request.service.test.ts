import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPrisma, type MockPrisma } from "./prisma-mock";

let mockPrisma: MockPrisma;

vi.mock("@/server/db", () => ({
  get prisma() {
    return mockPrisma;
  },
}));

import {
  createJoinRequest,
  reviewJoinRequest,
} from "@/server/services/join-request.service";

describe("join-request.service", () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma();
    vi.clearAllMocks();
  });

  describe("createJoinRequest", () => {
    it("creates a pending join request", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ organizationId: null });
      mockPrisma.organization.findUnique.mockResolvedValue({ id: "org-1" });
      mockPrisma.joinRequest.findUnique.mockResolvedValue(null);
      mockPrisma.joinRequest.create.mockResolvedValue({
        id: "req-1",
        userId: "user-1",
        organizationId: "org-1",
        status: "PENDING",
        organization: { name: "Acme" },
      });

      const result = await createJoinRequest("user-1", "org-1");

      expect(result.status).toBe("PENDING");
      expect(result.organizationId).toBe("org-1");
    });

    it("throws if user already belongs to an org", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        organizationId: "other-org",
      });

      await expect(
        createJoinRequest("user-1", "org-1"),
      ).rejects.toThrow("You already belong to an organization");
    });

    it("throws if organization not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ organizationId: null });
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      await expect(
        createJoinRequest("user-1", "missing-org"),
      ).rejects.toThrow("Organization not found");
    });

    it("throws if duplicate pending request exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ organizationId: null });
      mockPrisma.organization.findUnique.mockResolvedValue({ id: "org-1" });
      mockPrisma.joinRequest.findUnique.mockResolvedValue({
        id: "existing",
        status: "PENDING",
      });

      await expect(
        createJoinRequest("user-1", "org-1"),
      ).rejects.toThrow("already have a pending request");
    });

    it("allows re-apply after rejection", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ organizationId: null });
      mockPrisma.organization.findUnique.mockResolvedValue({ id: "org-1" });
      mockPrisma.joinRequest.findUnique.mockResolvedValue({
        id: "existing",
        status: "REJECTED",
      });
      mockPrisma.joinRequest.update.mockResolvedValue({
        id: "existing",
        status: "PENDING",
        organization: { name: "Acme" },
      });

      const result = await createJoinRequest("user-1", "org-1");

      expect(result.status).toBe("PENDING");
      expect(mockPrisma.joinRequest.update).toHaveBeenCalledOnce();
    });

    it("throws if request was already approved", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ organizationId: null });
      mockPrisma.organization.findUnique.mockResolvedValue({ id: "org-1" });
      mockPrisma.joinRequest.findUnique.mockResolvedValue({
        id: "existing",
        status: "APPROVED",
      });

      await expect(
        createJoinRequest("user-1", "org-1"),
      ).rejects.toThrow("already been approved");
    });
  });

  describe("reviewJoinRequest", () => {
    const pendingRequest = {
      id: "req-1",
      userId: "user-2",
      organizationId: "org-1",
      status: "PENDING",
      user: { id: "user-2", organizationId: null },
    };

    it("approves request and updates user atomically", async () => {
      mockPrisma.joinRequest.findUnique
        .mockResolvedValueOnce(pendingRequest)
        .mockResolvedValueOnce({
          ...pendingRequest,
          status: "APPROVED",
          assignedRole: "EMPLOYEE",
        });
      mockPrisma.joinRequest.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.user.updateMany.mockResolvedValue({ count: 1 });

      const result = await reviewJoinRequest(
        "req-1",
        "admin-1",
        "org-1",
        "APPROVED",
        "EMPLOYEE",
      );

      expect(result?.status).toBe("APPROVED");
      expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    });

    it("rejects request without modifying user", async () => {
      mockPrisma.joinRequest.findUnique
        .mockResolvedValueOnce(pendingRequest)
        .mockResolvedValueOnce({
          ...pendingRequest,
          status: "REJECTED",
        });
      mockPrisma.joinRequest.updateMany.mockResolvedValue({ count: 1 });

      const result = await reviewJoinRequest(
        "req-1",
        "admin-1",
        "org-1",
        "REJECTED",
      );

      expect(result?.status).toBe("REJECTED");
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
    });

    it("throws if request not found", async () => {
      mockPrisma.joinRequest.findUnique.mockResolvedValue(null);

      await expect(
        reviewJoinRequest("missing", "admin-1", "org-1", "APPROVED", "EMPLOYEE"),
      ).rejects.toThrow("Join request not found");
    });

    it("throws if request belongs to different org", async () => {
      mockPrisma.joinRequest.findUnique.mockResolvedValue({
        ...pendingRequest,
        organizationId: "other-org",
      });

      await expect(
        reviewJoinRequest("req-1", "admin-1", "org-1", "APPROVED", "EMPLOYEE"),
      ).rejects.toThrow("does not belong to your organization");
    });

    it("throws if request already processed", async () => {
      mockPrisma.joinRequest.findUnique.mockResolvedValue({
        ...pendingRequest,
        status: "APPROVED",
      });

      await expect(
        reviewJoinRequest("req-1", "admin-1", "org-1", "APPROVED", "EMPLOYEE"),
      ).rejects.toThrow("already been processed");
    });

    it("throws if trying to assign OWNER role", async () => {
      mockPrisma.joinRequest.findUnique.mockResolvedValue(pendingRequest);

      await expect(
        reviewJoinRequest("req-1", "admin-1", "org-1", "APPROVED", "OWNER"),
      ).rejects.toThrow("Cannot assign OWNER role");
    });

    it("throws if rejection was already processed concurrently", async () => {
      mockPrisma.joinRequest.findUnique.mockResolvedValue(pendingRequest);
      mockPrisma.joinRequest.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        reviewJoinRequest("req-1", "admin-1", "org-1", "REJECTED"),
      ).rejects.toThrow("already been processed");
    });

    it("throws if user already has org during approval", async () => {
      mockPrisma.joinRequest.findUnique.mockResolvedValue(pendingRequest);
      mockPrisma.joinRequest.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.user.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        reviewJoinRequest("req-1", "admin-1", "org-1", "APPROVED", "EMPLOYEE"),
      ).rejects.toThrow("User already belongs to an organization");
    });
  });
});
