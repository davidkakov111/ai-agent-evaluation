import { describe, expect, it } from "vitest";
import {
  canTransitionTaskStatus,
  canRoleUpdateTask,
  getAllowedTaskStatusTransitions,
} from "./task-status-rules";

describe("task-status-rules", () => {
  describe("getAllowedTaskStatusTransitions", () => {
    it("returns IN_PROGRESS for TODO", () => {
      expect(getAllowedTaskStatusTransitions("TODO")).toEqual(["IN_PROGRESS"]);
    });

    it("returns DONE for IN_PROGRESS", () => {
      expect(getAllowedTaskStatusTransitions("IN_PROGRESS")).toEqual(["DONE"]);
    });

    it("returns empty array for DONE", () => {
      expect(getAllowedTaskStatusTransitions("DONE")).toEqual([]);
    });
  });

  describe("canTransitionTaskStatus", () => {
    it("allows TODO -> IN_PROGRESS", () => {
      expect(canTransitionTaskStatus("TODO", "IN_PROGRESS")).toBe(true);
    });

    it("allows IN_PROGRESS -> DONE", () => {
      expect(canTransitionTaskStatus("IN_PROGRESS", "DONE")).toBe(true);
    });

    it("rejects same status (TODO -> TODO)", () => {
      expect(canTransitionTaskStatus("TODO", "TODO")).toBe(false);
    });

    it("rejects invalid transition TODO -> DONE", () => {
      expect(canTransitionTaskStatus("TODO", "DONE")).toBe(false);
    });

    it("rejects invalid transition IN_PROGRESS -> TODO", () => {
      expect(canTransitionTaskStatus("IN_PROGRESS", "TODO")).toBe(false);
    });

    it("rejects invalid transition DONE -> TODO", () => {
      expect(canTransitionTaskStatus("DONE", "TODO")).toBe(false);
    });

    it("rejects invalid transition DONE -> IN_PROGRESS", () => {
      expect(canTransitionTaskStatus("DONE", "IN_PROGRESS")).toBe(false);
    });

    it("rejects invalid transition IN_PROGRESS -> IN_PROGRESS", () => {
      expect(canTransitionTaskStatus("IN_PROGRESS", "IN_PROGRESS")).toBe(false);
    });
  });

  describe("canRoleUpdateTask", () => {
    const actorUserId = "user-1";
    const assignedToId = "user-2";

    it("OWNER can update any task", () => {
      expect(canRoleUpdateTask("OWNER", actorUserId, assignedToId)).toBe(true);
      expect(canRoleUpdateTask("OWNER", actorUserId, actorUserId)).toBe(true);
    });

    it("ADMIN can update any task", () => {
      expect(canRoleUpdateTask("ADMIN", actorUserId, assignedToId)).toBe(true);
      expect(canRoleUpdateTask("ADMIN", actorUserId, actorUserId)).toBe(true);
    });

    it("EMPLOYEE can update own task only", () => {
      expect(canRoleUpdateTask("EMPLOYEE", actorUserId, actorUserId)).toBe(
        true,
      );
    });

    it("EMPLOYEE cannot update task assigned to another", () => {
      expect(canRoleUpdateTask("EMPLOYEE", actorUserId, assignedToId)).toBe(
        false,
      );
    });
  });
});
