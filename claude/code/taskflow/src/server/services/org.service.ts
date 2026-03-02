import { prisma } from "@/server/db";
import { MemberRole } from "@/lib/constants";

export async function createOrganization(userId: string, name: string) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.organizationId) {
      throw new Error("You already belong to an organization");
    }

    const organization = await tx.organization.create({
      data: { name },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        organizationId: organization.id,
        role: MemberRole.OWNER,
      },
    });

    return organization;
  });
}

export async function getOrganization(orgId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      _count: { select: { members: true } },
    },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  return organization;
}

export async function getOrganizationMembers(orgId: string) {
  return prisma.user.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listOrganizations() {
  return prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  });
}
