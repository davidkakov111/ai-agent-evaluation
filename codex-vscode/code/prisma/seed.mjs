import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const seedPassword = "Password123!";
const passwordHashRounds = 12;

async function upsertUser({ email, name, passwordHash }) {
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
    },
    create: {
      email,
      name,
      passwordHash,
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(seedPassword, passwordHashRounds);

  const owner = await upsertUser({
    email: "owner@taskflow.local",
    name: "Owner User",
    passwordHash,
  });

  const admin = await upsertUser({
    email: "admin@taskflow.local",
    name: "Admin User",
    passwordHash,
  });

  const employee = await upsertUser({
    email: "employee@taskflow.local",
    name: "Employee User",
    passwordHash,
  });

  const candidate = await upsertUser({
    email: "candidate@taskflow.local",
    name: "Candidate User",
    passwordHash,
  });

  const organization = await prisma.organization.upsert({
    where: { slug: "acme" },
    update: {
      name: "Acme Organization",
      createdById: owner.id,
    },
    create: {
      name: "Acme Organization",
      slug: "acme",
      createdById: owner.id,
    },
  });

  await prisma.membership.upsert({
    where: { userId: owner.id },
    update: {
      organizationId: organization.id,
      role: "OWNER",
    },
    create: {
      userId: owner.id,
      organizationId: organization.id,
      role: "OWNER",
    },
  });

  await prisma.membership.upsert({
    where: { userId: admin.id },
    update: {
      organizationId: organization.id,
      role: "ADMIN",
    },
    create: {
      userId: admin.id,
      organizationId: organization.id,
      role: "ADMIN",
    },
  });

  await prisma.membership.upsert({
    where: { userId: employee.id },
    update: {
      organizationId: organization.id,
      role: "EMPLOYEE",
    },
    create: {
      userId: employee.id,
      organizationId: organization.id,
      role: "EMPLOYEE",
    },
  });

  await prisma.joinRequest.deleteMany({
    where: {
      organizationId: organization.id,
      userId: candidate.id,
    },
  });

  await prisma.joinRequest.create({
    data: {
      organizationId: organization.id,
      userId: candidate.id,
      requestedRole: "EMPLOYEE",
      status: "PENDING",
    },
  });

  const existingTaskCount = await prisma.task.count({
    where: {
      organizationId: organization.id,
    },
  });

  if (existingTaskCount === 0) {
    await prisma.task.createMany({
      data: [
        {
          organizationId: organization.id,
          title: "Review project requirements",
          description: "Read product requirements and collect open questions.",
          assignedToId: employee.id,
          createdById: owner.id,
          status: "TODO",
        },
        {
          organizationId: organization.id,
          title: "Prepare onboarding checklist",
          description: "Create onboarding checklist for new members.",
          assignedToId: employee.id,
          createdById: admin.id,
          status: "IN_PROGRESS",
        },
        {
          organizationId: organization.id,
          title: "Finalize sprint planning",
          description: "Approve sprint plan and communicate assignments.",
          assignedToId: employee.id,
          createdById: owner.id,
          status: "DONE",
        },
      ],
    });
  }

  console.info("Seed completed successfully.");
  console.info("Seed login users:");
  console.info("- owner@taskflow.local / Password123!");
  console.info("- admin@taskflow.local / Password123!");
  console.info("- employee@taskflow.local / Password123!");
  console.info("- candidate@taskflow.local / Password123!");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
