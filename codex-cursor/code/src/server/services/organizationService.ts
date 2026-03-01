import { OrgRole } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/server/db";
import { membershipRepository } from "@/server/repositories/membershipRepository";
import { organizationRepository } from "@/server/repositories/organizationRepository";
import type { DbClient } from "@/server/repositories/types";
import { ConflictError } from "@/server/services/errors";
import { parseInput } from "@/server/services/validation";

const createOrganizationSchema = z.object({
  actorUserId: z.string().cuid(),
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
});

export const organizationService = {
  async createOrganization(input: unknown, db: DbClient = prisma) {
    const parsed = parseInput(createOrganizationSchema, input);
    const transactionalDb = "$transaction" in db ? db : prisma;

    const existingMembership = await membershipRepository.findByUserId(
      db,
      parsed.actorUserId,
    );
    if (existingMembership) {
      throw new ConflictError("User already belongs to an organization.");
    }

    const existingOrganization = await organizationRepository.findBySlug(db, parsed.slug);
    if (existingOrganization) {
      throw new ConflictError("Organization slug is already in use.");
    }

    return transactionalDb.$transaction(async (tx) => {
      const organization = await organizationRepository.create(tx, {
        name: parsed.name,
        slug: parsed.slug,
        createdById: parsed.actorUserId,
      });

      const membership = await membershipRepository.create(tx, {
        userId: parsed.actorUserId,
        organizationId: organization.id,
        role: OrgRole.OWNER,
      });

      return { organization, membership };
    });
  },
};
