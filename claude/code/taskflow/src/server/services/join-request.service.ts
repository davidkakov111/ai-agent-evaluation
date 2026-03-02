import { prisma } from "@/server/db";
import {
  MemberRole,
  JoinRequestStatus,
} from "@/lib/constants";

export async function createJoinRequest(
  userId: string,
  organizationId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.organizationId) {
    throw new Error("You already belong to an organization");
  }

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) {
    throw new Error("Organization not found");
  }

  const existing = await prisma.joinRequest.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });

  if (existing) {
    if (existing.status === JoinRequestStatus.PENDING) {
      throw new Error(
        "You already have a pending request for this organization",
      );
    }

    if (existing.status === JoinRequestStatus.APPROVED) {
      throw new Error("You have already been approved for this organization");
    }

    // Re-apply after a previous rejection
    return prisma.joinRequest.update({
      where: { id: existing.id },
      data: {
        status: JoinRequestStatus.PENDING,
        assignedRole: null,
        reviewedBy: null,
      },
      include: {
        organization: { select: { name: true } },
      },
    });
  }

  return prisma.joinRequest.create({
    data: {
      userId,
      organizationId,
      status: JoinRequestStatus.PENDING,
    },
    include: {
      organization: { select: { name: true } },
    },
  });
}

export async function reviewJoinRequest(
  requestId: string,
  reviewerId: string,
  reviewerOrgId: string,
  action: "APPROVED" | "REJECTED",
  role?: MemberRole,
) {
  const request = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    include: {
      user: { select: { id: true, organizationId: true } },
    },
  });

  if (!request) {
    throw new Error("Join request not found");
  }

  if (request.organizationId !== reviewerOrgId) {
    throw new Error("This request does not belong to your organization");
  }

  if (request.status !== JoinRequestStatus.PENDING) {
    throw new Error("This request has already been processed");
  }

  if (action === "APPROVED") {
    if (!role) {
      throw new Error("Role is required when approving a request");
    }

    if (role === MemberRole.OWNER) {
      throw new Error("Cannot assign OWNER role via join requests");
    }

    if (role !== MemberRole.ADMIN && role !== MemberRole.EMPLOYEE) {
      throw new Error("Invalid role assignment");
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.joinRequest.updateMany({
        where: { id: requestId, status: JoinRequestStatus.PENDING },
        data: {
          status: JoinRequestStatus.APPROVED,
          assignedRole: role,
          reviewedBy: reviewerId,
        },
      });

      if (updated.count === 0) {
        throw new Error("This request has already been processed");
      }

      const userUpdate = await tx.user.updateMany({
        where: { id: request.userId, organizationId: null },
        data: {
          organizationId: request.organizationId,
          role,
        },
      });

      if (userUpdate.count === 0) {
        throw new Error("User already belongs to an organization");
      }

      return tx.joinRequest.findUnique({ where: { id: requestId } });
    });
  }

  const rejected = await prisma.joinRequest.updateMany({
    where: { id: requestId, status: JoinRequestStatus.PENDING },
    data: {
      status: JoinRequestStatus.REJECTED,
      reviewedBy: reviewerId,
    },
  });

  if (rejected.count === 0) {
    throw new Error("This request has already been processed");
  }

  return prisma.joinRequest.findUnique({ where: { id: requestId } });
}

export async function getPendingRequests(organizationId: string) {
  return prisma.joinRequest.findMany({
    where: {
      organizationId,
      status: JoinRequestStatus.PENDING,
    },
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getUserRequests(userId: string) {
  return prisma.joinRequest.findMany({
    where: { userId },
    include: {
      organization: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
