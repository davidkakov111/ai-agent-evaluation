import type { OrgRole } from "@prisma/client";
import type { Session } from "next-auth";

import { joinRequestRepository } from "@/server/repositories/joinRequestRepository";
import { membershipRepository } from "@/server/repositories/membershipRepository";
import { taskRepository } from "@/server/repositories/taskRepository";
import type { DbClient } from "@/server/repositories/types";
import { ForbiddenError, NotFoundError } from "@/server/services/errors";

const MANAGER_ROLES: readonly OrgRole[] = ["OWNER", "ADMIN"];

export type AuthenticatedUser = {
  id: string;
  organizationId: string | null;
  role: OrgRole | null;
};

export function requireAuth(session: Session | null): AuthenticatedUser {
  const userId = session?.user?.id;
  if (!userId) {
    throw new ForbiddenError("Authentication required.");
  }

  return {
    id: userId,
    organizationId: session.user.organizationId,
    role: session.user.role,
  };
}

export async function requireOrgMember(
  db: DbClient,
  input: { userId: string; organizationId: string },
) {
  const membership = await membershipRepository.findByUserIdInOrganization(
    db,
    input.userId,
    input.organizationId,
  );

  if (!membership) {
    throw new ForbiddenError("User is not a member of this organization.");
  }

  return membership;
}

export function requireRole<TAllowed extends readonly OrgRole[]>(
  currentRole: OrgRole,
  allowedRoles: TAllowed,
) {
  if (!allowedRoles.includes(currentRole)) {
    throw new ForbiddenError("User does not have enough permissions.");
  }

  return currentRole;
}

export function requireManagerRole(currentRole: OrgRole): OrgRole {
  return requireRole(currentRole, MANAGER_ROLES);
}

export function requireTaskAssigneeOrManager(input: {
  actorUserId: string;
  actorRole: OrgRole;
  assignedToId: string;
}) {
  if (MANAGER_ROLES.includes(input.actorRole)) {
    return;
  }

  if (input.actorUserId !== input.assignedToId) {
    throw new ForbiddenError("Employees can only manage their own assigned tasks.");
  }
}

export async function requireScopedTask(
  db: DbClient,
  input: { taskId: string; organizationId: string },
) {
  const task = await taskRepository.findByIdInOrganization(
    db,
    input.taskId,
    input.organizationId,
  );

  if (!task) {
    throw new NotFoundError("Task not found in this organization.");
  }

  return task;
}

export async function requireScopedJoinRequest(
  db: DbClient,
  input: { joinRequestId: string; organizationId: string },
) {
  const joinRequest = await joinRequestRepository.findByIdInOrganization(
    db,
    input.joinRequestId,
    input.organizationId,
  );

  if (!joinRequest) {
    throw new NotFoundError("Join request not found in this organization.");
  }

  return joinRequest;
}
