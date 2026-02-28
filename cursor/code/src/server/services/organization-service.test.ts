import { describe, expect, it, vi } from "vitest";
import { OrganizationService } from "./organization-service";
import { PreconditionFailedDomainError } from "@/server/errors";
import type { OrganizationRepository } from "@/server/repositories/organization-repository";
import type { PrismaClient } from "@prisma/client";

describe("OrganizationService", () => {
  describe("createOrganization", () => {
    it("creates org when user has no membership", async () => {
      const createdOrg = {
        id: "org-1",
        name: "Acme",
        slug: "acme",
        createdById: "user-1",
        createdAt: new Date(),
      };

      const mockFindMembership = vi.fn().mockResolvedValue(null);
      const mockCreateOrganization = vi.fn().mockResolvedValue(createdOrg);
      const mockCreateMembership = vi.fn().mockResolvedValue(undefined);

      const mockRepo: OrganizationRepository = {
        findMembershipByUserId: mockFindMembership,
        createOrganization: mockCreateOrganization,
        createMembership: mockCreateMembership,
      } as unknown as OrganizationRepository;

      const mockDb = {
        $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
          fn({}),
        ),
      };

      const service = new OrganizationService(
        mockDb as unknown as PrismaClient,
        mockRepo,
      );

      const result = await service.createOrganization(
        { name: "Acme", slug: "acme" },
        {
          id: "user-1",
          email: "u@example.com",
          name: "User",
          organizationId: null,
          role: null,
        },
      );

      expect(result).toEqual(createdOrg);
      expect(mockFindMembership).toHaveBeenCalled();
      expect(mockCreateOrganization).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Acme", slug: "acme" }),
        expect.anything(),
      );
      expect(mockCreateMembership).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          organizationId: "org-1",
          role: "OWNER",
        }),
        expect.anything(),
      );
    });

    it("rejects when user already has membership", async () => {
      const mockFindMembership = vi.fn().mockResolvedValue({
        organizationId: "org-existing",
        role: "EMPLOYEE",
      });

      const mockRepo: OrganizationRepository = {
        findMembershipByUserId: mockFindMembership,
      } as unknown as OrganizationRepository;

      const mockDb = {
        $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
          fn({}),
        ),
      };

      const service = new OrganizationService(
        mockDb as unknown as PrismaClient,
        mockRepo,
      );

      const sessionUser = {
        id: "user-1",
        email: "u@example.com",
        name: "User",
        organizationId: null,
        role: null,
      };

      await expect(
        service.createOrganization({ name: "New Org", slug: "new-org" }, sessionUser),
      ).rejects.toThrow(PreconditionFailedDomainError);

      await expect(
        service.createOrganization({ name: "New Org", slug: "new-org" }, sessionUser),
      ).rejects.toThrow(/already belongs to an organization/);
    });
  });
});
