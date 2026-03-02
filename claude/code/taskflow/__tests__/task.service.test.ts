import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockPrisma, type MockPrisma } from "./prisma-mock";

let mockPrisma: MockPrisma;

vi.mock("@/server/db", () => ({
  get prisma() {
    return mockPrisma;
  },
}));

import {
  createTask,
  updateTaskStatus,
  listTasks,
  getTask,
} from "@/server/services/task.service";

describe("task.service", () => {
  beforeEach(() => {
    mockPrisma = createMockPrisma();
    vi.clearAllMocks();
  });

  describe("createTask", () => {
    it("creates a task with TODO status", async () => {
      mockPrisma.task.create.mockResolvedValue({
        id: "task-1",
        title: "Fix bug",
        description: "",
        status: "TODO",
        organizationId: "org-1",
        assigneeId: null,
        creatorId: "user-1",
        assignee: null,
        creator: { id: "user-1", name: "Admin", email: "admin@test.com" },
      });

      const result = await createTask({
        title: "Fix bug",
        description: "",
        creatorId: "user-1",
        organizationId: "org-1",
      });

      expect(result.status).toBe("TODO");
      expect(result.title).toBe("Fix bug");
    });

    it("validates assignee belongs to same org", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        organizationId: "other-org",
      });

      await expect(
        createTask({
          title: "Task",
          description: "",
          assigneeId: "user-2",
          creatorId: "user-1",
          organizationId: "org-1",
        }),
      ).rejects.toThrow("Assignee must belong to the same organization");
    });

    it("rejects if assignee does not exist", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        createTask({
          title: "Task",
          description: "",
          assigneeId: "missing-user",
          creatorId: "user-1",
          organizationId: "org-1",
        }),
      ).rejects.toThrow("Assignee must belong to the same organization");
    });
  });

  describe("updateTaskStatus", () => {
    const orgTask = {
      id: "task-1",
      organizationId: "org-1",
      assigneeId: "employee-1",
      status: "TODO",
    };

    it("allows admin to update any task status (TODO -> IN_PROGRESS)", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(orgTask);
      mockPrisma.task.update.mockResolvedValue({
        ...orgTask,
        status: "IN_PROGRESS",
      });

      const result = await updateTaskStatus(
        "task-1",
        "admin-1",
        "ADMIN",
        "org-1",
        "IN_PROGRESS",
      );

      expect(result.status).toBe("IN_PROGRESS");
    });

    it("allows owner to update any task status (IN_PROGRESS -> DONE)", async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        ...orgTask,
        status: "IN_PROGRESS",
      });
      mockPrisma.task.update.mockResolvedValue({
        ...orgTask,
        status: "DONE",
      });

      const result = await updateTaskStatus(
        "task-1",
        "owner-1",
        "OWNER",
        "org-1",
        "DONE",
      );

      expect(result.status).toBe("DONE");
    });

    it("allows employee to update their own task", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(orgTask);
      mockPrisma.task.update.mockResolvedValue({
        ...orgTask,
        status: "IN_PROGRESS",
      });

      const result = await updateTaskStatus(
        "task-1",
        "employee-1",
        "EMPLOYEE",
        "org-1",
        "IN_PROGRESS",
      );

      expect(result.status).toBe("IN_PROGRESS");
    });

    it("denies employee updating another user's task", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(orgTask);

      await expect(
        updateTaskStatus(
          "task-1",
          "employee-other",
          "EMPLOYEE",
          "org-1",
          "IN_PROGRESS",
        ),
      ).rejects.toThrow("can only update the status of tasks assigned to you");
    });

    it("denies cross-org task access", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(orgTask);

      await expect(
        updateTaskStatus(
          "task-1",
          "admin-1",
          "ADMIN",
          "other-org",
          "IN_PROGRESS",
        ),
      ).rejects.toThrow("Task does not belong to your organization");
    });

    it("throws if task not found", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(
        updateTaskStatus("missing", "user-1", "ADMIN", "org-1", "DONE"),
      ).rejects.toThrow("Task not found");
    });

    it("rejects invalid status values", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(orgTask);

      await expect(
        updateTaskStatus("task-1", "admin-1", "ADMIN", "org-1", "DELETED"),
      ).rejects.toThrow("Invalid task status");
    });
  });

  describe("listTasks", () => {
    it("returns all org tasks for admin", async () => {
      mockPrisma.task.findMany.mockResolvedValue([
        { id: "t1" },
        { id: "t2" },
      ]);

      const result = await listTasks("org-1", "admin-1", "ADMIN");

      expect(result).toHaveLength(2);
      const whereArg = mockPrisma.task.findMany.mock.calls[0]![0] as {
        where: { organizationId: string; assigneeId?: string };
      };
      expect(whereArg.where).toEqual({ organizationId: "org-1" });
    });

    it("filters to assigned tasks only for employee", async () => {
      mockPrisma.task.findMany.mockResolvedValue([{ id: "t1" }]);

      const result = await listTasks("org-1", "employee-1", "EMPLOYEE");

      expect(result).toHaveLength(1);
      const whereArg = mockPrisma.task.findMany.mock.calls[0]![0] as {
        where: { organizationId: string; assigneeId?: string };
      };
      expect(whereArg.where).toEqual({
        organizationId: "org-1",
        assigneeId: "employee-1",
      });
    });
  });

  describe("getTask", () => {
    const task = {
      id: "task-1",
      organizationId: "org-1",
      assigneeId: "employee-1",
      assignee: { id: "employee-1", name: "Emp", email: "emp@test.com" },
      creator: { id: "admin-1", name: "Admin", email: "admin@test.com" },
    };

    it("returns task for admin in same org", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(task);

      const result = await getTask("task-1", "admin-1", "ADMIN", "org-1");

      expect(result.id).toBe("task-1");
    });

    it("returns task for assigned employee", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(task);

      const result = await getTask(
        "task-1",
        "employee-1",
        "EMPLOYEE",
        "org-1",
      );

      expect(result.id).toBe("task-1");
    });

    it("denies employee access to unassigned task", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(task);

      await expect(
        getTask("task-1", "employee-other", "EMPLOYEE", "org-1"),
      ).rejects.toThrow("You do not have access to this task");
    });

    it("denies cross-org access", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(task);

      await expect(
        getTask("task-1", "admin-1", "ADMIN", "other-org"),
      ).rejects.toThrow("Task does not belong to your organization");
    });
  });
});
