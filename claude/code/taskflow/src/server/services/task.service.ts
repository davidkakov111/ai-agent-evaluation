import { prisma } from "@/server/db";
import { MemberRole, TaskStatus, type MemberRole as MemberRoleType } from "@/lib/constants";

const VALID_STATUSES = new Set<string>(Object.values(TaskStatus));

export async function createTask(input: {
  title: string;
  description: string;
  assigneeId?: string;
  creatorId: string;
  organizationId: string;
}) {
  if (input.assigneeId) {
    const assignee = await prisma.user.findUnique({
      where: { id: input.assigneeId },
      select: { organizationId: true },
    });

    if (!assignee || assignee.organizationId !== input.organizationId) {
      throw new Error("Assignee must belong to the same organization");
    }
  }

  return prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      status: TaskStatus.TODO,
      organizationId: input.organizationId,
      assigneeId: input.assigneeId ?? null,
      creatorId: input.creatorId,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateTaskStatus(
  taskId: string,
  userId: string,
  userRole: MemberRoleType,
  userOrgId: string,
  newStatus: string,
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (task.organizationId !== userOrgId) {
    throw new Error("Task does not belong to your organization");
  }

  if (!VALID_STATUSES.has(newStatus)) {
    throw new Error("Invalid task status");
  }

  if (userRole === MemberRole.EMPLOYEE && task.assigneeId !== userId) {
    throw new Error("You can only update the status of tasks assigned to you");
  }

  return prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function assignTask(
  taskId: string,
  assigneeId: string,
  organizationId: string,
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (task.organizationId !== organizationId) {
    throw new Error("Task does not belong to your organization");
  }

  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { organizationId: true },
  });

  if (!assignee || assignee.organizationId !== organizationId) {
    throw new Error("Assignee must belong to the same organization");
  }

  return prisma.task.update({
    where: { id: taskId },
    data: { assigneeId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listTasks(
  organizationId: string,
  userId: string,
  role: MemberRoleType,
) {
  const where =
    role === MemberRole.EMPLOYEE
      ? { organizationId, assigneeId: userId }
      : { organizationId };

  return prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTask(
  taskId: string,
  userId: string,
  role: MemberRoleType,
  organizationId: string,
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (task.organizationId !== organizationId) {
    throw new Error("Task does not belong to your organization");
  }

  if (role === MemberRole.EMPLOYEE && task.assigneeId !== userId) {
    throw new Error("You do not have access to this task");
  }

  return task;
}
