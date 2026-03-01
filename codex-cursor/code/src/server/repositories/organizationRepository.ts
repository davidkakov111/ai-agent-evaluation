import type { DbClient } from "@/server/repositories/types";

const organizationSelect = {
  id: true,
  name: true,
  slug: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const organizationRepository = {
  findById(db: DbClient, id: string) {
    return db.organization.findUnique({
      where: { id },
      select: organizationSelect,
    });
  },

  findBySlug(db: DbClient, slug: string) {
    return db.organization.findUnique({
      where: { slug },
      select: organizationSelect,
    });
  },

  create(db: DbClient, input: { name: string; slug: string; createdById: string }) {
    return db.organization.create({
      data: input,
      select: organizationSelect,
    });
  },
};
