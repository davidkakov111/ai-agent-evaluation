import type { Prisma, TaskStatus } from "@prisma/client";
import type {
  CreateTaskInput,
  ListTasksInput,
  ReassignTaskInput,
  UpdateTaskStatusInput,
} from "@/lib/validation";
import type { SessionUser } from "@/server/auth/types";
import {
  ForbiddenDomainError,
  InternalDomainError,
  NotFoundDomainError,
  PreconditionFailedDomainError,
} from "@/server/errors";
import { requireAuth, requireMembership, requireOwnerOrAdminRole } from "@/server/policies";
import { TaskRepository } from "@/server/repositories/task-repository";
import { canRoleUpdateTask, canTransitionTaskStatus } from "./task-status-rules";

function isPrismaKnownError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as Prisma.PrismaClientKnownRequestError).code === "string"
  );
}

function toInternalError(message: string, error: unknown): InternalDomainError {
  return new InternalDomainError(message, {
    ...(error instanceof Error ? { cause: error } : {}),
  });
}

interface TaskSummary {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  assignedToId: string;
  createdById: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface ListTaskQueryOptions {
  offset?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "status";
  sortOrder?: "asc" | "desc";
}

function normalizeLimit(limit: number | undefined, fallback: number): number {
  if (limit === undefined) {
    return fallback;
  }

  return Math.min(Math.max(limit, 1), 100);
}

export class TaskService {
  public constructor(private readonly taskRepository: TaskRepository) {}

  public async createTask(
    input: CreateTaskInput,
    actor: SessionUser | null,
  ): Promise<TaskSummary> {
    const actorMember = requireOwnerOrAdminRole(requireAuth(actor));

    const assigneeMembership =
      await this.taskRepository.findMembershipByUserAndOrganization(
        input.assignedToUserId,
        actorMember.organizationId,
      );

    if (assigneeMembership === null) {
      throw new NotFoundDomainError(
        "Assigned user is not in your organization.",
      );
    }

    if (assigneeMembership.role !== "EMPLOYEE") {
      throw new PreconditionFailedDomainError(
        "Tasks can only be assigned to employees.",
      );
    }

    const description = input.description?.trim() ?? null;

    try {
      return await this.taskRepository.createTask({
        organizationId: actorMember.organizationId,
        title: input.title,
        description: description === "" ? null : description,
        assignedToId: input.assignedToUserId,
        createdById: actorMember.id,
      });
    } catch (error: unknown) {
      if (isPrismaKnownError(error)) {
        throw new PreconditionFailedDomainError(
          "Unable to create task with the provided assignment.",
        );
      }

      throw toInternalError("Unable to create task.", error);
    }
  }

  public async reassignTask(
    input: ReassignTaskInput,
    actor: SessionUser | null,
  ): Promise<void> {
    const actorMember = requireOwnerOrAdminRole(requireAuth(actor));

    const task = await this.taskRepository.findTaskByIdInOrganization(
      input.taskId,
      actorMember.organizationId,
    );

    if (task === null) {
      throw new NotFoundDomainError("Task not found.");
    }

    if (task.status === "DONE") {
      throw new PreconditionFailedDomainError(
        "Cannot reassign a completed task.",
      );
    }

    const assigneeMembership =
      await this.taskRepository.findMembershipByUserAndOrganization(
        input.assignedToUserId,
        actorMember.organizationId,
      );

    if (assigneeMembership === null) {
      throw new NotFoundDomainError(
        "Assigned user is not in your organization.",
      );
    }

    if (assigneeMembership.role !== "EMPLOYEE") {
      throw new PreconditionFailedDomainError(
        "Tasks can only be assigned to employees.",
      );
    }

    const updatedCount = await this.taskRepository.reassignTask({
      taskId: task.id,
      organizationId: actorMember.organizationId,
      assignedToId: input.assignedToUserId,
    });

    if (updatedCount !== 1) {
      throw new PreconditionFailedDomainError(
        "Task assignment changed before update could complete.",
      );
    }
  }

  public async listTasks(
    input: ListTasksInput,
    actor: SessionUser | null,
    options?: ListTaskQueryOptions,
  ): Promise<TaskSummary[]> {
    const actorMember = requireMembership(requireAuth(actor));
    const limit = normalizeLimit(options?.limit ?? input?.limit, 50);
    const offset = Math.max(options?.offset ?? 0, 0);
    const sortBy = options?.sortBy ?? "createdAt";
    const sortOrder = options?.sortOrder ?? "desc";

    if (actorMember.role === "EMPLOYEE") {
      return this.taskRepository.listTasksForAssignee(
        actorMember.organizationId,
        actorMember.id,
        input?.status,
        {
          skip: offset,
          take: limit,
          sortBy,
          sortOrder,
        },
      );
    }

    return this.taskRepository.listTasksForOrganization(
      actorMember.organizationId,
      input?.status,
      {
        skip: offset,
        take: limit,
        sortBy,
        sortOrder,
      },
    );
  }

  public async updateTaskStatus(
    input: UpdateTaskStatusInput,
    actor: SessionUser | null,
  ): Promise<TaskSummary> {
    const actorMember = requireMembership(requireAuth(actor));

    const task = await this.taskRepository.findTaskByIdInOrganization(
      input.taskId,
      actorMember.organizationId,
    );

    if (task === null) {
      throw new NotFoundDomainError("Task not found.");
    }

    if (
      !canRoleUpdateTask(actorMember.role, actorMember.id, task.assignedToId)
    ) {
      throw new ForbiddenDomainError(
        "Employees can update only their assigned tasks.",
      );
    }

    if (!canTransitionTaskStatus(task.status, input.status)) {
      throw new PreconditionFailedDomainError(
        "Invalid task status transition.",
      );
    }

    const updatedCount = await this.taskRepository.updateTaskStatusAtomic({
      taskId: task.id,
      organizationId: task.organizationId,
      currentStatus: task.status,
      nextStatus: input.status,
    });

    if (updatedCount !== 1) {
      throw new PreconditionFailedDomainError(
        "Task status changed before update could complete.",
      );
    }

    const updatedTask = await this.taskRepository.findTaskByIdInOrganization(
      input.taskId,
      actorMember.organizationId,
    );

    if (updatedTask === null) {
      throw new InternalDomainError("Task disappeared after status update.");
    }

    return updatedTask;
  }
}
