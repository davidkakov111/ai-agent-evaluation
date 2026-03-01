import { OrgRole, TaskStatus } from "@prisma/client";
import { z } from "zod";

import { logger } from "@/lib/logger";
import {
  requireManagerRole,
  requireOrgMember,
  requireScopedTask,
  requireTaskAssigneeOrManager,
} from "@/server/auth/policies";
import { prisma } from "@/server/db";
import { membershipRepository } from "@/server/repositories/membershipRepository";
import { taskRepository } from "@/server/repositories/taskRepository";
import type { DbClient } from "@/server/repositories/types";
import {
  ForbiddenError,
  InvalidTransitionError,
  NotFoundError,
} from "@/server/services/errors";
import { parseInput } from "@/server/services/validation";

const createTaskSchema = z.object({
  actorUserId: z.string().cuid(),
  organizationId: z.string().cuid(),
  assignedToId: z.string().cuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  status: z.nativeEnum(TaskStatus).optional(),
});

const listVisibleTasksSchema = z.object({
  actorUserId: z.string().cuid(),
  organizationId: z.string().cuid(),
});

const updateTaskStatusSchema = z.object({
  actorUserId: z.string().cuid(),
  taskId: z.string().cuid(),
  status: z.nativeEnum(TaskStatus),
});

const assignTaskSchema = z.object({
  actorUserId: z.string().cuid(),
  taskId: z.string().cuid(),
  assignedToId: z.string().cuid(),
});

const allowedTaskTransitions: Record<TaskStatus, readonly TaskStatus[]> = {
  TODO: [TaskStatus.IN_PROGRESS],
  IN_PROGRESS: [TaskStatus.TODO, TaskStatus.DONE],
  DONE: [TaskStatus.IN_PROGRESS],
};

export const taskService = {
  async createTask(input: unknown, db: DbClient = prisma) {
    const parsed = parseInput(createTaskSchema, input);

    const actorMembership = await requireOrgMember(db, {
      userId: parsed.actorUserId,
      organizationId: parsed.organizationId,
    });
    requireManagerRole(actorMembership.role);

    const assigneeMembership = await requireOrgMember(db, {
      userId: parsed.assignedToId,
      organizationId: parsed.organizationId,
    });
    if (!assigneeMembership || assigneeMembership.role !== OrgRole.EMPLOYEE) {
      throw new ForbiddenError("Tasks can only be assigned to employees in the same organization.");
    }

    const createdTask = await taskRepository.create(db, {
      organizationId: parsed.organizationId,
      createdById: parsed.actorUserId,
      assignedToId: parsed.assignedToId,
      assignedById: parsed.actorUserId,
      title: parsed.title,
      description: parsed.description,
      ...(parsed.status ? { status: parsed.status } : {}),
    });
    logger.info("task.create.success", {
      taskId: createdTask.id,
      organizationId: createdTask.organizationId,
      actorUserId: parsed.actorUserId,
      assignedToId: createdTask.assignedToId,
    });
    return createdTask;
  },

  async listVisibleTasks(input: unknown, db: DbClient = prisma) {
    const parsed = parseInput(listVisibleTasksSchema, input);

    const actorMembership = await requireOrgMember(db, {
      userId: parsed.actorUserId,
      organizationId: parsed.organizationId,
    });

    if (actorMembership.role === OrgRole.OWNER || actorMembership.role === OrgRole.ADMIN) {
      return taskRepository.listByOrganization(db, parsed.organizationId);
    }

    return taskRepository.listAssignedToUser(
      db,
      parsed.organizationId,
      parsed.actorUserId,
    );
  },

  async updateTaskStatus(input: unknown, db: DbClient = prisma) {
    const parsed = parseInput(updateTaskStatusSchema, input);

    const actorMembership = await membershipRepository.findByUserId(db, parsed.actorUserId);
    if (!actorMembership) {
      throw new NotFoundError("Membership not found.");
    }

    const task = await requireScopedTask(db, {
      taskId: parsed.taskId,
      organizationId: actorMembership.organizationId,
    });

    await requireOrgMember(db, {
      userId: parsed.actorUserId,
      organizationId: task.organizationId,
    });

    requireTaskAssigneeOrManager({
      actorUserId: parsed.actorUserId,
      actorRole: actorMembership.role,
      assignedToId: task.assignedToId,
    });

    if (task.status !== parsed.status) {
      const allowedNextStates = allowedTaskTransitions[task.status];
      if (!allowedNextStates.includes(parsed.status)) {
        logger.warn("task.status.invalid_transition", {
          taskId: task.id,
          fromStatus: task.status,
          toStatus: parsed.status,
          actorUserId: parsed.actorUserId,
        });
        throw new InvalidTransitionError(
          `Invalid task transition: ${task.status} -> ${parsed.status}.`,
        );
      }
    }

    const updatedTask = await taskRepository.updateStatus(db, {
      id: task.id,
      status: parsed.status,
      statusUpdatedById: parsed.actorUserId,
    });
    logger.info("task.status.update.success", {
      taskId: updatedTask.id,
      fromStatus: task.status,
      toStatus: updatedTask.status,
      actorUserId: parsed.actorUserId,
    });
    return updatedTask;
  },

  async assignTask(input: unknown, db: DbClient = prisma) {
    const parsed = parseInput(assignTaskSchema, input);

    const actorMembership = await membershipRepository.findByUserId(db, parsed.actorUserId);
    if (!actorMembership) {
      throw new NotFoundError("Membership not found.");
    }
    requireManagerRole(actorMembership.role);

    const task = await requireScopedTask(db, {
      taskId: parsed.taskId,
      organizationId: actorMembership.organizationId,
    });

    const assigneeMembership = await requireOrgMember(db, {
      userId: parsed.assignedToId,
      organizationId: task.organizationId,
    });
    if (assigneeMembership.role !== OrgRole.EMPLOYEE) {
      throw new ForbiddenError("Tasks can only be assigned to employees.");
    }

    const updatedTask = await taskRepository.updateAssignee(db, {
      id: task.id,
      assignedToId: parsed.assignedToId,
      assignedById: parsed.actorUserId,
    });
    logger.info("task.assign.success", {
      taskId: updatedTask.id,
      actorUserId: parsed.actorUserId,
      assignedToId: updatedTask.assignedToId,
      organizationId: updatedTask.organizationId,
    });
    return updatedTask;
  },
};
