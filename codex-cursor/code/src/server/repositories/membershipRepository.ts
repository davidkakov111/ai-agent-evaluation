import type { OrgRole } from "@prisma/client";

import type { DbClient } from "@/server/repositories/types";

const membershipSelect = {
  id: true,
  userId: true,
  organizationId: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const membershipRepository = {
  findByUserId(db: DbClient, userId: string) {
    return db.membership.findUnique({
      where: { userId },
      select: membershipSelect,
    });
  },

  findByUserIdInOrganization(db: DbClient, userId: string, organizationId: string) {
    return db.membership.findFirst({
      where: { userId, organizationId },
      select: membershipSelect,
    });
  },

  create(db: DbClient, input: { userId: string; organizationId: string; role: OrgRole }) {
    return db.membership.create({
      data: input,
      select: membershipSelect,
    });
  },

  listByOrganization(db: DbClient, organizationId: string) {
    return db.membership.findMany({
      where: { organizationId },
      select: membershipSelect,
      orderBy: { createdAt: "asc" },
    });
  },
};
