import type { Prisma, PrismaClient, Role } from "@prisma/client";
import type {
  ApproveJoinRequestInput,
  CreateOrganizationInput,
  RejectJoinRequestInput,
  RequestJoinOrganizationInput,
} from "@/lib/validation";
import type { SessionUser } from "@/server/auth";
import {
  ConflictDomainError,
  ForbiddenDomainError,
  InternalDomainError,
  NotFoundDomainError,
  PreconditionFailedDomainError,
} from "@/server/errors";
import {
  ensureSameOrganizationScope,
  requireAuth,
  requireMembership,
  requireOwnerOrAdminRole,
} from "@/server/policies";
import { OrganizationRepository } from "@/server/repositories";

function isPrismaKnownError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  );
}

function getPrismaErrorTarget(error: Prisma.PrismaClientKnownRequestError): readonly string[] {
  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target.filter((item): item is string => typeof item === "string");
  }

  if (typeof target === "string") {
    return [target];
  }

  return [];
}

function toInternalError(message: string, error: unknown): InternalDomainError {
  return new InternalDomainError(message, {
    ...(error instanceof Error ? { cause: error } : {}),
  });
}

interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
}

interface CreatedOrganization extends OrganizationSummary {
  createdById: string;
  createdAt: Date;
}

interface JoinRequestSummary {
  id: string;
  userId: string;
  organizationId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedRole: "OWNER" | "ADMIN" | "EMPLOYEE";
  createdAt: Date;
}

interface PendingJoinRequest extends Omit<JoinRequestSummary, "status"> {
  status: "PENDING";
  user: {
    email: string;
    name: string;
  };
}

interface ListDiscoverableOrganizationsOptions {
  offset?: number;
  limit?: number;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

interface ListPendingJoinRequestsOptions {
  offset?: number;
  limit?: number;
  sortOrder?: "asc" | "desc";
}

interface ListMembersOptions {
  offset?: number;
  limit?: number;
  role?: "OWNER" | "ADMIN" | "EMPLOYEE";
  sortOrder?: "asc" | "desc";
}

interface OrganizationMemberSummary {
  userId: string;
  organizationId: string;
  role: "OWNER" | "ADMIN" | "EMPLOYEE";
  createdAt: Date;
  user: {
    email: string;
    name: string;
  };
}

export class OrganizationService {
  public constructor(
    private readonly db: PrismaClient,
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  public async createOrganization(
    input: CreateOrganizationInput,
    actor: SessionUser | null,
  ): Promise<CreatedOrganization> {
    const user = requireAuth(actor);

    try {
      return await this.db.$transaction(async (tx) => {
        const membership = await this.organizationRepository.findMembershipByUserId(user.id, tx);
        if (membership !== null) {
          throw new PreconditionFailedDomainError(
            "User already belongs to an organization and cannot create a new one.",
          );
        }

        const organization = await this.organizationRepository.createOrganization(
          {
            name: input.name,
            slug: input.slug,
            createdById: user.id,
          },
          tx,
        );

        await this.organizationRepository.createMembership(
          {
            userId: user.id,
            organizationId: organization.id,
            role: "OWNER",
          },
          tx,
        );

        return organization;
      });
    } catch (error: unknown) {
      if (error instanceof PreconditionFailedDomainError) {
        throw error;
      }

      if (isPrismaKnownError(error) && error.code === "P2002") {
        const target = getPrismaErrorTarget(error).join(",");

        if (target.includes("slug")) {
          throw new ConflictDomainError("Organization slug is already in use.");
        }

        if (target.includes("userId")) {
          throw new PreconditionFailedDomainError(
            "User already belongs to an organization and cannot create a new one.",
          );
        }
      }

      throw toInternalError("Unable to create organization.", error);
    }
  }

  public async requestToJoinOrganization(
    input: RequestJoinOrganizationInput,
    actor: SessionUser | null,
  ): Promise<JoinRequestSummary> {
    const user = requireAuth(actor);

    try {
      return await this.db.$transaction(async (tx) => {
        const membership = await this.organizationRepository.findMembershipByUserId(user.id, tx);
        if (membership !== null) {
          throw new PreconditionFailedDomainError(
            "User already belongs to an organization and cannot request another.",
          );
        }

        const organization = await this.organizationRepository.findOrganizationById(
          input.organizationId,
          tx,
        );
        if (organization === null) {
          throw new NotFoundDomainError("Organization does not exist.");
        }

        const pendingJoinRequest =
          await this.organizationRepository.findPendingJoinRequestByUserInOrganization(
            user.id,
            organization.id,
            tx,
          );

        if (pendingJoinRequest !== null) {
          throw new ConflictDomainError("A pending join request already exists.");
        }

        return this.organizationRepository.createJoinRequest(
          {
            userId: user.id,
            organizationId: organization.id,
            requestedRole: "EMPLOYEE",
          },
          tx,
        );
      });
    } catch (error: unknown) {
      if (
        error instanceof PreconditionFailedDomainError ||
        error instanceof NotFoundDomainError ||
        error instanceof ConflictDomainError
      ) {
        throw error;
      }

      throw toInternalError("Unable to create join request.", error);
    }
  }

  public async listPendingJoinRequests(
    actor: SessionUser | null,
    options?: ListPendingJoinRequestsOptions,
  ): Promise<PendingJoinRequest[]> {
    const member = requireOwnerOrAdminRole(requireAuth(actor));
    const offset = Math.max(options?.offset ?? 0, 0);
    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
    const sortOrder = options?.sortOrder ?? "asc";

    const pending = await this.organizationRepository.listPendingJoinRequestsByOrganizationWithOptions(
      member.organizationId,
      {
        skip: offset,
        take: limit,
        sortOrder,
      },
    );

    return pending.map((request) => ({
      ...request,
      status: "PENDING",
    }));
  }

  public async listOrganizationMembers(
    actor: SessionUser | null,
    options?: ListMembersOptions,
  ): Promise<OrganizationMemberSummary[]> {
    const member = requireOwnerOrAdminRole(requireAuth(actor));
    const offset = Math.max(options?.offset ?? 0, 0);
    const limit = Math.min(Math.max(options?.limit ?? 100, 1), 100);
    const sortOrder = options?.sortOrder ?? "asc";

    const members = await this.organizationRepository.listMembersByOrganization(
      member.organizationId,
      {
        skip: offset,
        take: limit,
        ...(options?.role !== undefined ? { role: options.role } : {}),
        sortOrder,
      },
    );

    return members.map((membership) => ({
      userId: membership.userId,
      organizationId: membership.organizationId,
      role: membership.role,
      createdAt: membership.createdAt,
      user: {
        email: membership.user.email,
        name: membership.user.name,
      },
    }));
  }

  public async approveJoinRequest(
    input: ApproveJoinRequestInput,
    actor: SessionUser | null,
  ): Promise<void> {
    await this.reviewJoinRequest({
      input: {
        joinRequestId: input.joinRequestId,
        status: "APPROVED",
        roleToAssign: input.role,
      },
      actor,
    });
  }

  public async rejectJoinRequest(
    input: RejectJoinRequestInput,
    actor: SessionUser | null,
  ): Promise<void> {
    await this.reviewJoinRequest({
      input: {
        joinRequestId: input.joinRequestId,
        status: "REJECTED",
        roleToAssign: null,
      },
      actor,
    });
  }

  public async listDiscoverableOrganizations(
    options?: ListDiscoverableOrganizationsOptions,
  ): Promise<OrganizationSummary[]> {
    const offset = Math.max(options?.offset ?? 0, 0);
    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
    const sortBy = options?.sortBy ?? "name";
    const sortOrder = options?.sortOrder ?? "asc";

    const organizations = await this.organizationRepository.listDiscoverableOrganizations({
      skip: offset,
      take: limit,
      sortBy,
      sortOrder,
    });

    return organizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    }));
  }

  public listPublicOrganizations(limit = 50): Promise<OrganizationSummary[]> {
    return this.listDiscoverableOrganizations({ limit });
  }

  private async reviewJoinRequest(params: {
    input: {
      joinRequestId: string;
      status: "APPROVED" | "REJECTED";
      roleToAssign: Role | null;
    };
    actor: SessionUser | null;
  }): Promise<void> {
    const authenticated = requireAuth(params.actor);
    const reviewer = requireOwnerOrAdminRole(authenticated);
    const reviewerMembership = requireMembership(reviewer);

    const joinRequest = await this.organizationRepository.findJoinRequestByIdInOrganization(
      params.input.joinRequestId,
      reviewerMembership.organizationId,
    );

    if (joinRequest === null) {
      throw new NotFoundDomainError("Join request not found.");
    }

    ensureSameOrganizationScope(reviewerMembership.organizationId, joinRequest.organizationId);

    if (joinRequest.status !== "PENDING") {
      throw new PreconditionFailedDomainError("Join request is no longer pending.");
    }

    try {
      await this.db.$transaction(async (tx) => {
        const updatedCount = await this.organizationRepository.updateJoinRequestStatus(
          {
            id: joinRequest.id,
            organizationId: reviewerMembership.organizationId,
            status: params.input.status,
            reviewedById: reviewer.id,
          },
          tx,
        );

        if (updatedCount !== 1) {
          throw new PreconditionFailedDomainError("Join request is no longer pending.");
        }

        if (params.input.status === "APPROVED") {
          if (params.input.roleToAssign === null) {
            throw new ForbiddenDomainError("Role assignment is required for approved requests.");
          }

          const targetMembership = await this.organizationRepository.findMembershipByUserId(
            joinRequest.userId,
            tx,
          );

          if (targetMembership !== null) {
            throw new PreconditionFailedDomainError(
              "User already belongs to an organization and cannot be approved again.",
            );
          }

          await this.organizationRepository.createMembership(
            {
              userId: joinRequest.userId,
              organizationId: reviewerMembership.organizationId,
              role: params.input.roleToAssign,
            },
            tx,
          );
        }
      });
    } catch (error: unknown) {
      if (
        error instanceof PreconditionFailedDomainError ||
        error instanceof ForbiddenDomainError
      ) {
        throw error;
      }

      if (isPrismaKnownError(error) && error.code === "P2002") {
        const target = getPrismaErrorTarget(error).join(",");
        if (target.includes("userId")) {
          throw new PreconditionFailedDomainError(
            "User already belongs to an organization and cannot be approved again.",
          );
        }
      }

      throw toInternalError("Unable to review join request.", error);
    }
  }
}
