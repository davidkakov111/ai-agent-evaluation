import { JoinRequestStatus, OrgRole } from "@prisma/client";
import { z } from "zod";

import { logger } from "@/lib/logger";
import {
  requireManagerRole,
  requireOrgMember,
  requireScopedJoinRequest,
} from "@/server/auth/policies";
import { prisma } from "@/server/db";
import { joinRequestRepository } from "@/server/repositories/joinRequestRepository";
import { membershipRepository } from "@/server/repositories/membershipRepository";
import { organizationRepository } from "@/server/repositories/organizationRepository";
import type { DbClient } from "@/server/repositories/types";
import {
  ConflictError,
  InvalidTransitionError,
  NotFoundError,
} from "@/server/services/errors";
import { parseInput } from "@/server/services/validation";

const cuidSchema = z.string().regex(/^[cC][^\s-]{8,}$/, "Invalid cuid");

const createJoinRequestSchema = z.object({
  userId: cuidSchema,
  organizationId: cuidSchema,
  requestedRole: z
    .enum(OrgRole)
    .refine((role) => role !== OrgRole.OWNER, "Cannot request OWNER role.")
    .optional()
    .default(OrgRole.EMPLOYEE),
});

const decideJoinRequestSchema = z.object({
  actorUserId: cuidSchema,
  joinRequestId: cuidSchema,
  decision: z.enum([JoinRequestStatus.APPROVED, JoinRequestStatus.REJECTED]),
  assignedRole: z.enum(OrgRole).optional(),
});

const listJoinRequestsSchema = z.object({
  actorUserId: cuidSchema,
});

export const joinRequestService = {
  async createJoinRequest(input: unknown, db: DbClient = prisma) {
    const parsed = parseInput(createJoinRequestSchema, input);

    const organization = await organizationRepository.findById(db, parsed.organizationId);
    if (!organization) {
      throw new NotFoundError("Organization not found.");
    }

    const existingMembership = await membershipRepository.findByUserId(db, parsed.userId);
    if (existingMembership) {
      throw new ConflictError("User already belongs to an organization.");
    }

    const existingJoinRequest = await joinRequestRepository.findByOrganizationAndUser(
      db,
      parsed.organizationId,
      parsed.userId,
    );

    if (existingJoinRequest) {
      if (existingJoinRequest.status === JoinRequestStatus.PENDING) {
        logger.warn("join_request.create.conflict_pending", {
          organizationId: parsed.organizationId,
          userId: parsed.userId,
        });
        throw new ConflictError("A pending join request already exists.");
      }

      const reopened = await joinRequestRepository.reopenAsPending(db, {
        id: existingJoinRequest.id,
        requestedRole: parsed.requestedRole,
      });
      logger.info("join_request.create.reopened", {
        joinRequestId: reopened.id,
        organizationId: reopened.organizationId,
        userId: reopened.userId,
        requestedRole: reopened.requestedRole,
      });
      return reopened;
    }

    const created = await joinRequestRepository.create(db, parsed);
    logger.info("join_request.create.success", {
      joinRequestId: created.id,
      organizationId: created.organizationId,
      userId: created.userId,
      requestedRole: created.requestedRole,
    });
    return created;
  },

  async decideJoinRequest(input: unknown, db: DbClient = prisma) {
    const parsed = parseInput(decideJoinRequestSchema, input);
    const transactionalDb = "$transaction" in db ? db : prisma;

    return transactionalDb.$transaction(async (tx) => {
      const actorMembership = await membershipRepository.findByUserId(
        tx,
        parsed.actorUserId,
      );
      if (!actorMembership) {
        throw new NotFoundError("Actor membership not found.");
      }

      await requireOrgMember(tx, {
        userId: parsed.actorUserId,
        organizationId: actorMembership.organizationId,
      });
      requireManagerRole(actorMembership.role);

      const joinRequest = await requireScopedJoinRequest(tx, {
        joinRequestId: parsed.joinRequestId,
        organizationId: actorMembership.organizationId,
      });
      if (joinRequest.status !== JoinRequestStatus.PENDING) {
        throw new InvalidTransitionError(
          "Only pending join requests can be approved or rejected.",
        );
      }

      if (parsed.decision === JoinRequestStatus.APPROVED) {
        const existingMembership = await membershipRepository.findByUserId(
          tx,
          joinRequest.userId,
        );
        if (existingMembership) {
          throw new ConflictError("User already belongs to an organization.");
        }

        const assignedRole = parsed.assignedRole ?? joinRequest.requestedRole;
        await membershipRepository.create(tx, {
          userId: joinRequest.userId,
          organizationId: joinRequest.organizationId,
          role: assignedRole,
        });
        logger.info("join_request.approve.membership_created", {
          joinRequestId: joinRequest.id,
          organizationId: joinRequest.organizationId,
          userId: joinRequest.userId,
          assignedRole,
          actorUserId: parsed.actorUserId,
        });
      }

      const decidedRequest = await joinRequestRepository.markDecidedIfPending(tx, {
        id: joinRequest.id,
        status: parsed.decision,
        decidedById: parsed.actorUserId,
        decidedAt: new Date(),
        ...(parsed.decision === JoinRequestStatus.APPROVED
          ? { requestedRole: parsed.assignedRole ?? joinRequest.requestedRole }
          : {}),
      });

      if (!decidedRequest) {
        throw new InvalidTransitionError(
          "Join request is no longer pending and cannot be decided.",
        );
      }

      logger.info("join_request.decide.success", {
        joinRequestId: decidedRequest.id,
        status: decidedRequest.status,
        actorUserId: parsed.actorUserId,
        organizationId: decidedRequest.organizationId,
      });
      return decidedRequest;
    });
  },

  async listJoinRequests(input: unknown, db: DbClient = prisma) {
    const parsed = parseInput(listJoinRequestsSchema, input);

    const actorMembership = await membershipRepository.findByUserId(db, parsed.actorUserId);
    if (!actorMembership) {
      return joinRequestRepository.listByUser(db, parsed.actorUserId);
    }

    if (actorMembership.role === OrgRole.OWNER || actorMembership.role === OrgRole.ADMIN) {
      return joinRequestRepository.listByOrganization(db, actorMembership.organizationId);
    }

    return joinRequestRepository.listByUser(db, parsed.actorUserId);
  },
};
