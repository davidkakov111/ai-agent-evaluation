import type { AppRole, SessionUser } from "@/server/auth";
import { ForbiddenDomainError, UnauthorizedDomainError } from "@/server/errors";

export type MemberUser = SessionUser & { organizationId: string; role: AppRole };

export function requireAuth(user: SessionUser | null): SessionUser {
  if (user === null) {
    throw new UnauthorizedDomainError();
  }

  return user;
}

export function requireMembership(user: SessionUser): MemberUser {
  if (user.organizationId === null || user.role === null) {
    throw new ForbiddenDomainError("Organization membership is required.");
  }

  return user as MemberUser;
}

export function requireRole(user: SessionUser, allowedRoles: readonly AppRole[]): MemberUser {
  const member = requireMembership(user);

  if (!allowedRoles.includes(member.role)) {
    throw new ForbiddenDomainError();
  }

  return member;
}

export function requireOwnerOrAdminRole(user: SessionUser): MemberUser {
  return requireRole(user, ["OWNER", "ADMIN"]);
}

export function ensureSameOrganizationScope(
  actorOrganizationId: string,
  targetOrganizationId: string,
): void {
  if (actorOrganizationId !== targetOrganizationId) {
    throw new ForbiddenDomainError();
  }
}

// Backward-compatible aliases for earlier step names.
export const requireAuthenticatedUser = requireAuth;
export const requireOrganizationMembership = requireMembership;
export const requireAnyRole = requireRole;
