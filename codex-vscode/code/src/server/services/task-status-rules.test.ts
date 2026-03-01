import { describe, expect, it } from "vitest";
import {
  canRoleUpdateTask,
  canTransitionTaskStatus,
  getAllowedTaskStatusTransitions,
} from "./task-status-rules";

describe("task status transition rules", () => {
  it("allows valid transitions", () => {
    expect(canTransitionTaskStatus("TODO", "IN_PROGRESS")).toBe(true);
    expect(canTransitionTaskStatus("IN_PROGRESS", "DONE")).toBe(true);
  });

  it("blocks invalid transitions", () => {
    expect(canTransitionTaskStatus("TODO", "DONE")).toBe(false);
    expect(canTransitionTaskStatus("IN_PROGRESS", "TODO")).toBe(false);
    expect(canTransitionTaskStatus("DONE", "TODO")).toBe(false);
    expect(canTransitionTaskStatus("DONE", "IN_PROGRESS")).toBe(false);
  });

  it("blocks same-state transitions", () => {
    expect(canTransitionTaskStatus("TODO", "TODO")).toBe(false);
    expect(canTransitionTaskStatus("IN_PROGRESS", "IN_PROGRESS")).toBe(false);
    expect(canTransitionTaskStatus("DONE", "DONE")).toBe(false);
  });

  it("returns expected allowed transitions per status", () => {
    expect(getAllowedTaskStatusTransitions("TODO")).toEqual(["IN_PROGRESS"]);
    expect(getAllowedTaskStatusTransitions("IN_PROGRESS")).toEqual(["DONE"]);
    expect(getAllowedTaskStatusTransitions("DONE")).toEqual([]);
  });

  it("enforces role ownership checks", () => {
    expect(canRoleUpdateTask("OWNER", "actor-1", "employee-1")).toBe(true);
    expect(canRoleUpdateTask("ADMIN", "actor-1", "employee-1")).toBe(true);
    expect(canRoleUpdateTask("EMPLOYEE", "employee-1", "employee-1")).toBe(true);
    expect(canRoleUpdateTask("EMPLOYEE", "employee-2", "employee-1")).toBe(false);
  });
});
