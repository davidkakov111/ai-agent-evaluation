import type {
  JoinRequestStatus,
  Prisma,
  PrismaClient,
  Role,
} from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;
type SortOrder = "asc" | "desc";

interface CreateOrganizationInput {
  name: string;
  slug: string;
  createdById: string;
}

interface CreateMembershipInput {
  userId: string;
  organizationId: string;
  role: Role;
}

interface CreateJoinRequestInput {
  userId: string;
  organizationId: string;
  requestedRole: Role;
}

interface UpdateJoinRequestStatusInput {
  id: string;
  organizationId: string;
  status: JoinRequestStatus;
  reviewedById: string;
}

interface ListDiscoverableOrganizationsOptions {
  skip: number;
  take: number;
  sortBy: "name" | "createdAt";
  sortOrder: SortOrder;
}

interface ListPendingJoinRequestsOptions {
  skip: number;
  take: number;
  sortOrder: SortOrder;
}

interface ListMembersOptions {
  skip: number;
  take: number;
  role?: Role;
  sortOrder: SortOrder;
}

export class OrganizationRepository {
  public constructor(private readonly db: PrismaClient) {}

  private getClient(tx?: Prisma.TransactionClient): DbClient {
    return tx ?? this.db;
  }

  public findMembershipByUserId(userId: string, tx?: Prisma.TransactionClient) {
    return this.getClient(tx).membership.findUnique({
      where: { userId },
      select: {
        organizationId: true,
        role: true,
      },
    });
  }

  public createOrganization(
    input: CreateOrganizationInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        createdById: input.createdById,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdById: true,
        createdAt: true,
      },
    });
  }

  public createMembership(
    input: CreateMembershipInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).membership.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId,
        role: input.role,
      },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        role: true,
        createdAt: true,
      },
    });
  }

  public findOrganizationById(
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }

  public findPendingJoinRequestByUserInOrganization(
    userId: string,
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).joinRequest.findFirst({
      where: {
        userId,
        organizationId,
        status: "PENDING",
      },
      select: {
        id: true,
      },
    });
  }

  public createJoinRequest(
    input: CreateJoinRequestInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).joinRequest.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId,
        requestedRole: input.requestedRole,
      },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        status: true,
        requestedRole: true,
        createdAt: true,
      },
    });
  }

  public listPendingJoinRequestsByOrganizationWithOptions(
    organizationId: string,
    options: ListPendingJoinRequestsOptions,
  ) {
    return this.db.joinRequest.findMany({
      where: {
        organizationId,
        status: "PENDING",
      },
      orderBy: [{ createdAt: options.sortOrder }, { id: "asc" }],
      skip: options.skip,
      take: options.take,
      select: {
        id: true,
        userId: true,
        organizationId: true,
        status: true,
        requestedRole: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
  }

  public findJoinRequestByIdInOrganization(
    joinRequestId: string,
    organizationId: string,
  ) {
    return this.db.joinRequest.findFirst({
      where: {
        id: joinRequestId,
        organizationId,
      },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        status: true,
        requestedRole: true,
      },
    });
  }

  public listMembersByOrganization(
    organizationId: string,
    options: ListMembersOptions,
  ) {
    return this.db.membership.findMany({
      where: {
        organizationId,
        ...(options.role !== undefined ? { role: options.role } : {}),
      },
      orderBy: [{ createdAt: options.sortOrder }, { id: "asc" }],
      skip: options.skip,
      take: options.take,
      select: {
        userId: true,
        organizationId: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
  }

  public listDiscoverableOrganizations(
    options: ListDiscoverableOrganizationsOptions,
  ) {
    return this.db.organization.findMany({
      skip: options.skip,
      take: options.take,
      orderBy: [{ [options.sortBy]: options.sortOrder }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });
  }

  public updateJoinRequestStatus(
    input: UpdateJoinRequestStatusInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    return this.getClient(tx)
      .joinRequest.updateMany({
        where: {
          id: input.id,
          organizationId: input.organizationId,
          status: "PENDING",
        },
        data: {
          status: input.status,
          reviewedById: input.reviewedById,
          reviewedAt: new Date(),
        },
      })
      .then((result) => result.count);
  }
}
