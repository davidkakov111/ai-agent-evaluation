import { OrgRole, TaskStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { DbClient } from "@/server/repositories/types";
import { ForbiddenError, InvalidTransitionError } from "@/server/services/errors";
import { taskService } from "@/server/services/taskService";

type MembershipRecord = {
  userId: string;
  organizationId: string;
  role: OrgRole;
};

type TaskRecord = {
  id: string;
  organizationId: string;
  createdById: string;
  assignedToId: string;
  assignedById: string | null;
  assignedAt: Date | null;
  statusUpdatedById: string | null;
  statusUpdatedAt: Date | null;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
};

function createMockDb(input: {
  actorMembership: MembershipRecord | null;
  actorMembershipInOrg: MembershipRecord | null;
  task: TaskRecord | null;
}) {
  const taskUpdated: TaskRecord | null = input.task
    ? {
        ...input.task,
      }
    : null;

  const db = {
    membership: {
      findUnique: vi.fn(async () => input.actorMembership),
      findFirst: vi.fn(async () => input.actorMembershipInOrg),
    },
    task: {
      findFirst: vi.fn(async () => input.task),
      update: vi.fn(
        async (args: {
          where: { id: string };
          data: {
            status?: TaskStatus;
            statusUpdatedById?: string;
            statusUpdatedAt?: Date;
          };
        }) => {
          if (!taskUpdated) {
            throw new Error("Task missing");
          }

          if (args.data.status) {
            taskUpdated.status = args.data.status;
          }
          if (args.data.statusUpdatedById) {
            taskUpdated.statusUpdatedById = args.data.statusUpdatedById;
          }
          if (args.data.statusUpdatedAt) {
            taskUpdated.statusUpdatedAt = args.data.statusUpdatedAt;
          }

          return taskUpdated;
        },
      ),
    },
  };

  return db as unknown as DbClient;
}

describe("taskService.updateTaskStatus", () => {
  it("allows assignee to move TODO -> IN_PROGRESS", async () => {
    const task: TaskRecord = {
      id: "cktask000000000000000001",
      organizationId: "ckorg000000000000000001",
      createdById: "ckowner0000000000000001",
      assignedToId: "ckemp000000000000000001",
      assignedById: "ckowner0000000000000001",
      assignedAt: new Date(),
      statusUpdatedById: null,
      statusUpdatedAt: null,
      title: "Task A",
      description: "Desc",
      status: TaskStatus.TODO,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = createMockDb({
      actorMembership: {
        userId: "ckemp000000000000000001",
        organizationId: "ckorg000000000000000001",
        role: OrgRole.EMPLOYEE,
      },
      actorMembershipInOrg: {
        userId: "ckemp000000000000000001",
        organizationId: "ckorg000000000000000001",
        role: OrgRole.EMPLOYEE,
      },
      task,
    });

    const result = await taskService.updateTaskStatus(
      {
        actorUserId: "ckemp000000000000000001",
        taskId: task.id,
        status: TaskStatus.IN_PROGRESS,
      },
      db,
    );

    expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    expect(result.statusUpdatedById).toBe("ckemp000000000000000001");
  });

  it("rejects invalid transition TODO -> DONE", async () => {
    const task: TaskRecord = {
      id: "cktask000000000000000002",
      organizationId: "ckorg000000000000000001",
      createdById: "ckowner0000000000000001",
      assignedToId: "ckemp000000000000000001",
      assignedById: "ckowner0000000000000001",
      assignedAt: new Date(),
      statusUpdatedById: null,
      statusUpdatedAt: null,
      title: "Task B",
      description: "Desc",
      status: TaskStatus.TODO,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = createMockDb({
      actorMembership: {
        userId: "ckemp000000000000000001",
        organizationId: "ckorg000000000000000001",
        role: OrgRole.EMPLOYEE,
      },
      actorMembershipInOrg: {
        userId: "ckemp000000000000000001",
        organizationId: "ckorg000000000000000001",
        role: OrgRole.EMPLOYEE,
      },
      task,
    });

    await expect(
      taskService.updateTaskStatus(
        {
          actorUserId: "ckemp000000000000000001",
          taskId: task.id,
          status: TaskStatus.DONE,
        },
        db,
      ),
    ).rejects.toBeInstanceOf(InvalidTransitionError);
  });

  it("rejects employee updating another employee's task", async () => {
    const task: TaskRecord = {
      id: "cktask000000000000000003",
      organizationId: "ckorg000000000000000001",
      createdById: "ckowner0000000000000001",
      assignedToId: "ckemp000000000000000002",
      assignedById: "ckowner0000000000000001",
      assignedAt: new Date(),
      statusUpdatedById: null,
      statusUpdatedAt: null,
      title: "Task C",
      description: "Desc",
      status: TaskStatus.IN_PROGRESS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = createMockDb({
      actorMembership: {
        userId: "ckemp000000000000000001",
        organizationId: "ckorg000000000000000001",
        role: OrgRole.EMPLOYEE,
      },
      actorMembershipInOrg: {
        userId: "ckemp000000000000000001",
        organizationId: "ckorg000000000000000001",
        role: OrgRole.EMPLOYEE,
      },
      task,
    });

    await expect(
      taskService.updateTaskStatus(
        {
          actorUserId: "ckemp000000000000000001",
          taskId: task.id,
          status: TaskStatus.DONE,
        },
        db,
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
