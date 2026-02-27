import type { Prisma, PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ForbiddenDomainError,
  PreconditionFailedDomainError,
} from "@/server/errors";
import { OrganizationService } from "./organization-service";

type TxClient = Prisma.TransactionClient;

interface MockDb {
  $transaction: <T>(cb: (tx: TxClient) => Promise<T>) => Promise<T>;
}

const actorOwner = {
  id: "owner-1",
  email: "owner@taskflow.local",
  name: "Owner",
  organizationId: "org-a",
  role: "OWNER" as const,
};

const actorAdmin = {
  id: "admin-1",
  email: "admin@taskflow.local",
  name: "Admin",
  organizationId: "org-a",
  role: "ADMIN" as const,
};

describe("OrganizationService invariants", () => {
  const tx = {} as TxClient;
  let db: MockDb;
  let repository: {
    findMembershipByUserId: ReturnType<typeof vi.fn>;
    createOrganization: ReturnType<typeof vi.fn>;
    createMembership: ReturnType<typeof vi.fn>;
    findOrganizationById: ReturnType<typeof vi.fn>;
    findPendingJoinRequestByUserInOrganization: ReturnType<typeof vi.fn>;
    createJoinRequest: ReturnType<typeof vi.fn>;
    listPendingJoinRequestsByOrganizationWithOptions: ReturnType<typeof vi.fn>;
    findJoinRequestByIdInOrganization: ReturnType<typeof vi.fn>;
    updateJoinRequestStatus: ReturnType<typeof vi.fn>;
    listMembersByOrganization: ReturnType<typeof vi.fn>;
  };
  let service: OrganizationService;

  beforeEach(() => {
    db = {
      $transaction: async <T>(cb: (txArg: TxClient) => Promise<T>) => cb(tx),
    };

    repository = {
      findMembershipByUserId: vi.fn(),
      createOrganization: vi.fn(),
      createMembership: vi.fn(),
      findOrganizationById: vi.fn(),
      findPendingJoinRequestByUserInOrganization: vi.fn(),
      createJoinRequest: vi.fn(),
      listPendingJoinRequestsByOrganizationWithOptions: vi.fn(),
      findJoinRequestByIdInOrganization: vi.fn(),
      updateJoinRequestStatus: vi.fn(),
      listMembersByOrganization: vi.fn(),
    };

    service = new OrganizationService(
      db as unknown as PrismaClient,
      repository as unknown as ConstructorParameters<typeof OrganizationService>[1],
    );
  });

  it("blocks organization creation when actor already has membership", async () => {
    repository.findMembershipByUserId.mockResolvedValueOnce({
      organizationId: "org-existing",
      role: "EMPLOYEE",
    });

    await expect(
      service.createOrganization({ name: "New Org", slug: "new-org" }, actorOwner),
    ).rejects.toBeInstanceOf(PreconditionFailedDomainError);
  });

  it("blocks join requests when actor already has membership", async () => {
    repository.findMembershipByUserId.mockResolvedValueOnce({
      organizationId: "org-existing",
      role: "EMPLOYEE",
    });

    await expect(
      service.requestToJoinOrganization({ organizationId: "org-target" }, actorAdmin),
    ).rejects.toBeInstanceOf(PreconditionFailedDomainError);
  });

  it("rejects cross-tenant join-request review", async () => {
    repository.findJoinRequestByIdInOrganization.mockResolvedValueOnce({
      id: "jr-1",
      userId: "employee-2",
      organizationId: "org-b",
      status: "PENDING",
      requestedRole: "EMPLOYEE",
    });

    await expect(
      service.approveJoinRequest({ joinRequestId: "jr-1", role: "EMPLOYEE" }, actorOwner),
    ).rejects.toBeInstanceOf(ForbiddenDomainError);
  });

  it("blocks approval when target user already belongs to an organization", async () => {
    repository.findJoinRequestByIdInOrganization.mockResolvedValueOnce({
      id: "jr-1",
      userId: "employee-2",
      organizationId: "org-a",
      status: "PENDING",
      requestedRole: "EMPLOYEE",
    });
    repository.findMembershipByUserId.mockResolvedValueOnce({
      organizationId: "org-other",
      role: "EMPLOYEE",
    });

    await expect(
      service.approveJoinRequest({ joinRequestId: "jr-1", role: "EMPLOYEE" }, actorAdmin),
    ).rejects.toBeInstanceOf(PreconditionFailedDomainError);
  });

  it("handles duplicate-membership race condition as precondition failure", async () => {
    repository.findJoinRequestByIdInOrganization.mockResolvedValueOnce({
      id: "jr-1",
      userId: "employee-2",
      organizationId: "org-a",
      status: "PENDING",
      requestedRole: "EMPLOYEE",
    });
    repository.findMembershipByUserId.mockResolvedValueOnce(null);
    repository.updateJoinRequestStatus.mockResolvedValueOnce(1);

    repository.createMembership.mockRejectedValueOnce({
      code: "P2002",
      meta: { target: ["Membership_userId_key"] },
    });

    await expect(
      service.approveJoinRequest({ joinRequestId: "jr-1", role: "EMPLOYEE" }, actorOwner),
    ).rejects.toBeInstanceOf(PreconditionFailedDomainError);
  });

  it("reject flow updates request without creating membership", async () => {
    repository.findJoinRequestByIdInOrganization.mockResolvedValueOnce({
      id: "jr-1",
      userId: "employee-2",
      organizationId: "org-a",
      status: "PENDING",
      requestedRole: "EMPLOYEE",
    });
    repository.findMembershipByUserId.mockResolvedValueOnce(null);
    repository.updateJoinRequestStatus.mockResolvedValueOnce(1);

    await service.rejectJoinRequest({ joinRequestId: "jr-1" }, actorOwner);

    expect(repository.createMembership).not.toHaveBeenCalled();
    expect(repository.updateJoinRequestStatus).toHaveBeenCalledTimes(1);
  });
});
