import { OrgRole } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/server/db";
import { membershipRepository } from "@/server/repositories/membershipRepository";
import type { DbClient } from "@/server/repositories/types";
import { ConflictError, ForbiddenError, NotFoundError } from "@/server/services/errors";
import { parseInput } from "@/server/services/validation";

const getMembershipByUserSchema = z.object({
  userId: z.string().cuid(),
});

const createMembershipSchema = z.object({
  userId: z.string().cuid(),
  organizationId: z.string().cuid(),
  role: z.nativeEnum(OrgRole),
});

const leaveOrganizationSchema = z.object({
  userId: z.string().cuid(),
});

export const membershipService = {
  async getMembershipByUser(input: unknown, db: DbClient = prisma) {
    const parsed = parseInput(getMembershipByUserSchema, input);
    return membershipRepository.findByUserId(db, parsed.userId);
  },

  async createMembership(input: unknown, db: DbClient = prisma) {
    const parsed = parseInput(createMembershipSchema, input);

    const existingMembership = await membershipRepository.findByUserId(
      db,
      parsed.userId,
    );
    if (existingMembership) {
      throw new ConflictError("User already belongs to an organization.");
    }

    return membershipRepository.create(db, parsed);
  },

  async leaveOrganization(input: unknown, db: DbClient = prisma) {
    const parsed = parseInput(leaveOrganizationSchema, input);

    const membership = await membershipRepository.findByUserId(db, parsed.userId);
    if (!membership) {
      throw new NotFoundError("Membership not found.");
    }

    throw new ForbiddenError("Users cannot leave an organization once joined.");
  },
};
