import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

import { JoinRequestStatus, OrgRole, PrismaClient, TaskStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { appRouter } from "@/server/api/root";

type SeededUsers = {
  owner: { id: string; email: string; name: string };
  admin: { id: string; email: string; name: string };
  employeeA: { id: string; email: string; name: string };
  employeeB: { id: string; email: string; name: string };
  joiner: { id: string; email: string; name: string };
  outsider: { id: string; email: string; name: string };
};

type SeedState = {
  organizationAId: string;
  organizationBId: string;
  users: SeededUsers;
  taskAId: string;
  taskBId: string;
};

let prisma: PrismaClient;
let seed: SeedState;
let testDbPath = "";
let testDbUrl = "";

function createSession(input: {
  id: string;
  email: string;
  name: string;
  organizationId: string | null;
  role: OrgRole | null;
}): Session {
  return {
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user: {
      id: input.id,
      email: input.email,
      name: input.name,
      organizationId: input.organizationId,
      role: input.role,
    },
  };
}

function createCaller(session: Session | null) {
  return appRouter.createCaller({
    headers: new Headers(),
    requestId: "test-request-id",
    prisma,
    session,
  });
}

async function expectTRPCError(
  promise: Promise<unknown>,
  expectedCode: TRPCError["code"],
): Promise<void> {
  try {
    await promise;
    throw new Error("Expected tRPC error but call succeeded.");
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(TRPCError);
    if (error instanceof TRPCError) {
      expect(error.code).toBe(expectedCode);
    }
  }
}

async function seedDatabase(client: PrismaClient): Promise<SeedState> {
  const owner = await client.user.create({
    data: {
      email: "owner.test@taskflow.local",
      name: "Owner",
      passwordHash: "hashed",
    },
    select: { id: true, email: true, name: true },
  });

  const admin = await client.user.create({
    data: {
      email: "admin.test@taskflow.local",
      name: "Admin",
      passwordHash: "hashed",
    },
    select: { id: true, email: true, name: true },
  });

  const employeeA = await client.user.create({
    data: {
      email: "employee-a.test@taskflow.local",
      name: "Employee A",
      passwordHash: "hashed",
    },
    select: { id: true, email: true, name: true },
  });

  const employeeB = await client.user.create({
    data: {
      email: "employee-b.test@taskflow.local",
      name: "Employee B",
      passwordHash: "hashed",
    },
    select: { id: true, email: true, name: true },
  });

  const joiner = await client.user.create({
    data: {
      email: "joiner.test@taskflow.local",
      name: "Joiner",
      passwordHash: "hashed",
    },
    select: { id: true, email: true, name: true },
  });

  const outsider = await client.user.create({
    data: {
      email: "outsider.test@taskflow.local",
      name: "Outsider",
      passwordHash: "hashed",
    },
    select: { id: true, email: true, name: true },
  });

  const organizationA = await client.organization.create({
    data: {
      name: "Org A",
      slug: "org-a",
      createdById: owner.id,
    },
    select: { id: true },
  });

  const organizationB = await client.organization.create({
    data: {
      name: "Org B",
      slug: "org-b",
      createdById: outsider.id,
    },
    select: { id: true },
  });

  await client.membership.createMany({
    data: [
      { userId: owner.id, organizationId: organizationA.id, role: OrgRole.OWNER },
      { userId: admin.id, organizationId: organizationA.id, role: OrgRole.ADMIN },
      { userId: employeeA.id, organizationId: organizationA.id, role: OrgRole.EMPLOYEE },
      { userId: employeeB.id, organizationId: organizationA.id, role: OrgRole.EMPLOYEE },
      { userId: outsider.id, organizationId: organizationB.id, role: OrgRole.OWNER },
    ],
  });

  const taskA = await client.task.create({
    data: {
      organizationId: organizationA.id,
      createdById: owner.id,
      assignedToId: employeeA.id,
      assignedById: owner.id,
      assignedAt: new Date(),
      title: "Task A",
      description: "A",
      status: TaskStatus.TODO,
    },
    select: { id: true },
  });

  const taskB = await client.task.create({
    data: {
      organizationId: organizationA.id,
      createdById: owner.id,
      assignedToId: employeeB.id,
      assignedById: owner.id,
      assignedAt: new Date(),
      title: "Task B",
      description: "B",
      status: TaskStatus.IN_PROGRESS,
    },
    select: { id: true },
  });

  return {
    organizationAId: organizationA.id,
    organizationBId: organizationB.id,
    users: { owner, admin, employeeA, employeeB, joiner, outsider },
    taskAId: taskA.id,
    taskBId: taskB.id,
  };
}

describe.sequential("tRPC integration workflows", () => {
  beforeAll(async () => {
    testDbPath = join(process.cwd(), "prisma", `test-${Date.now()}.db`);
    testDbUrl = `file:${testDbPath}`;

    execSync("npx prisma migrate deploy", {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: "pipe",
    });

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });

    seed = await seedDatabase(prisma);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (existsSync(testDbPath)) {
      rmSync(testDbPath);
    }
    const journalPath = `${testDbPath}-journal`;
    if (existsSync(journalPath)) {
      rmSync(journalPath);
    }
  });

  it("enforces role-aware task visibility", async () => {
    const adminCaller = createCaller(
      createSession({
        ...seed.users.admin,
        organizationId: seed.organizationAId,
        role: OrgRole.ADMIN,
      }),
    );
    const adminTasks = await adminCaller.task.list();
    expect(adminTasks).toHaveLength(2);

    const employeeCaller = createCaller(
      createSession({
        ...seed.users.employeeA,
        organizationId: seed.organizationAId,
        role: OrgRole.EMPLOYEE,
      }),
    );
    const employeeTasks = await employeeCaller.task.list();
    expect(employeeTasks).toHaveLength(1);
    expect(employeeTasks[0]?.assignedToId).toBe(seed.users.employeeA.id);
  });

  it("rejects unauthorized and cross-org task operations", async () => {
    const unauthenticatedCaller = createCaller(null);
    await expectTRPCError(unauthenticatedCaller.task.list(), "UNAUTHORIZED");

    const outsiderCaller = createCaller(
      createSession({
        ...seed.users.outsider,
        organizationId: seed.organizationBId,
        role: OrgRole.OWNER,
      }),
    );
    await expectTRPCError(
      outsiderCaller.task.updateStatus({
        taskId: seed.taskAId,
        status: TaskStatus.IN_PROGRESS,
      }),
      "NOT_FOUND",
    );
  });

  it("handles join approval workflow and duplicate conflicts", async () => {
    const joinerCaller = createCaller(
      createSession({
        ...seed.users.joiner,
        organizationId: null,
        role: null,
      }),
    );

    const createdJoinRequest = await joinerCaller.joinRequest.create({
      organizationId: seed.organizationAId,
      requestedRole: OrgRole.EMPLOYEE,
    });
    expect(createdJoinRequest.status).toBe(JoinRequestStatus.PENDING);

    await expectTRPCError(
      joinerCaller.joinRequest.create({
        organizationId: seed.organizationAId,
        requestedRole: OrgRole.EMPLOYEE,
      }),
      "CONFLICT",
    );

    const ownerCaller = createCaller(
      createSession({
        ...seed.users.owner,
        organizationId: seed.organizationAId,
        role: OrgRole.OWNER,
      }),
    );

    const approved = await ownerCaller.joinRequest.approve({
      joinRequestId: createdJoinRequest.id,
      assignedRole: OrgRole.EMPLOYEE,
    });
    expect(approved.status).toBe(JoinRequestStatus.APPROVED);

    const joinerMembership = await prisma.membership.findUnique({
      where: { userId: seed.users.joiner.id },
      select: { role: true, organizationId: true },
    });
    expect(joinerMembership?.organizationId).toBe(seed.organizationAId);
    expect(joinerMembership?.role).toBe(OrgRole.EMPLOYEE);

    await expectTRPCError(
      ownerCaller.joinRequest.approve({
        joinRequestId: createdJoinRequest.id,
        assignedRole: OrgRole.EMPLOYEE,
      }),
      "PRECONDITION_FAILED",
    );
  });
});
