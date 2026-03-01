import bcrypt from "bcryptjs";
import { PrismaClient, OrgRole, JoinRequestStatus, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const ownerPasswordHash = await bcrypt.hash("OwnerPass123!", 12);
  const employeePasswordHash = await bcrypt.hash("EmployeePass123!", 12);
  const adminPasswordHash = await bcrypt.hash("AdminPass123!", 12);

  const owner = await prisma.user.upsert({
    where: { email: "owner@taskflow.local" },
    update: { name: "Owner User", passwordHash: ownerPasswordHash },
    create: {
      email: "owner@taskflow.local",
      name: "Owner User",
      passwordHash: ownerPasswordHash,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@taskflow.local" },
    update: { name: "Admin User", passwordHash: adminPasswordHash },
    create: {
      email: "admin@taskflow.local",
      name: "Admin User",
      passwordHash: adminPasswordHash,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "employee@taskflow.local" },
    update: { name: "Employee User", passwordHash: employeePasswordHash },
    create: {
      email: "employee@taskflow.local",
      name: "Employee User",
      passwordHash: employeePasswordHash,
    },
  });

  const org = await prisma.organization.upsert({
    where: { slug: "taskflow-demo" },
    update: { name: "TaskFlow Demo Org", createdById: owner.id },
    create: {
      name: "TaskFlow Demo Org",
      slug: "taskflow-demo",
      createdById: owner.id,
    },
  });

  await prisma.membership.upsert({
    where: { userId: owner.id },
    update: { organizationId: org.id, role: OrgRole.OWNER },
    create: {
      userId: owner.id,
      organizationId: org.id,
      role: OrgRole.OWNER,
    },
  });

  await prisma.membership.upsert({
    where: { userId: admin.id },
    update: { organizationId: org.id, role: OrgRole.ADMIN },
    create: {
      userId: admin.id,
      organizationId: org.id,
      role: OrgRole.ADMIN,
    },
  });

  await prisma.joinRequest.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: employee.id,
      },
    },
    update: {
      requestedRole: OrgRole.EMPLOYEE,
      status: JoinRequestStatus.PENDING,
      decidedById: null,
      decidedAt: null,
    },
    create: {
      organizationId: org.id,
      userId: employee.id,
      requestedRole: OrgRole.EMPLOYEE,
      status: JoinRequestStatus.PENDING,
    },
  });

  await prisma.task.upsert({
    where: {
      id: "demo-task-1",
    },
    update: {
      title: "Set up onboarding docs",
      description: "Write onboarding notes for the TaskFlow tenant workspace.",
      createdById: owner.id,
      assignedToId: admin.id,
      organizationId: org.id,
      status: TaskStatus.IN_PROGRESS,
    },
    create: {
      id: "demo-task-1",
      title: "Set up onboarding docs",
      description: "Write onboarding notes for the TaskFlow tenant workspace.",
      createdById: owner.id,
      assignedToId: admin.id,
      organizationId: org.id,
      status: TaskStatus.IN_PROGRESS,
    },
  });
}

main()
  .catch(async (error: unknown) => {
    console.error("Failed to seed database", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
