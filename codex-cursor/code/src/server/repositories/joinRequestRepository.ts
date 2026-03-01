import type { JoinRequestStatus, OrgRole } from "@prisma/client";

import type { DbClient } from "@/server/repositories/types";

const joinRequestSelect = {
  id: true,
  userId: true,
  organizationId: true,
  requestedRole: true,
  status: true,
  decidedById: true,
  decidedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const joinRequestRepository = {
  findById(db: DbClient, id: string) {
    return db.joinRequest.findUnique({
      where: { id },
      select: joinRequestSelect,
    });
  },

  findByIdInOrganization(db: DbClient, id: string, organizationId: string) {
    return db.joinRequest.findFirst({
      where: {
        id,
        organizationId,
      },
      select: joinRequestSelect,
    });
  },

  findByOrganizationAndUser(
    db: DbClient,
    organizationId: string,
    userId: string,
  ) {
    return db.joinRequest.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: joinRequestSelect,
    });
  },

  listByOrganization(db: DbClient, organizationId: string) {
    return db.joinRequest.findMany({
      where: { organizationId },
      select: joinRequestSelect,
      orderBy: { createdAt: "desc" },
    });
  },

  listByUser(db: DbClient, userId: string) {
    return db.joinRequest.findMany({
      where: { userId },
      select: joinRequestSelect,
      orderBy: { createdAt: "desc" },
    });
  },

  create(
    db: DbClient,
    input: { userId: string; organizationId: string; requestedRole: OrgRole },
  ) {
    return db.joinRequest.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId,
        requestedRole: input.requestedRole,
      },
      select: joinRequestSelect,
    });
  },

  reopenAsPending(
    db: DbClient,
    input: { id: string; requestedRole: OrgRole },
  ) {
    return db.joinRequest.update({
      where: { id: input.id },
      data: {
        status: "PENDING",
        requestedRole: input.requestedRole,
        decidedById: null,
        decidedAt: null,
      },
      select: joinRequestSelect,
    });
  },

  markDecided(
    db: DbClient,
    input: {
      id: string;
      status: Exclude<JoinRequestStatus, "PENDING">;
      decidedById: string;
      decidedAt: Date;
    },
  ) {
    return db.joinRequest.update({
      where: { id: input.id },
      data: {
        status: input.status,
        decidedById: input.decidedById,
        decidedAt: input.decidedAt,
      },
      select: joinRequestSelect,
    });
  },

  async markDecidedIfPending(
    db: DbClient,
    input: {
      id: string;
      status: Exclude<JoinRequestStatus, "PENDING">;
      decidedById: string;
      decidedAt: Date;
    },
  ) {
    const updateResult = await db.joinRequest.updateMany({
      where: {
        id: input.id,
        status: "PENDING",
      },
      data: {
        status: input.status,
        decidedById: input.decidedById,
        decidedAt: input.decidedAt,
      },
    });

    if (updateResult.count === 0) {
      return null;
    }

    return db.joinRequest.findUnique({
      where: { id: input.id },
      select: joinRequestSelect,
    });
  },
};
