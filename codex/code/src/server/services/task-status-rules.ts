import type { TaskStatus } from "@prisma/client";

const transitionMap: Record<TaskStatus, readonly TaskStatus[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["DONE"],
  DONE: [],
};

export type TaskActorRole = "OWNER" | "ADMIN" | "EMPLOYEE";

export function getAllowedTaskStatusTransitions(current: TaskStatus): readonly TaskStatus[] {
  return transitionMap[current];
}

export function canTransitionTaskStatus(current: TaskStatus, next: TaskStatus): boolean {
  if (current === next) {
    return false;
  }

  return transitionMap[current].includes(next);
}

export function canRoleUpdateTask(role: TaskActorRole, actorUserId: string, assignedToId: string): boolean {
  if (role === "OWNER" || role === "ADMIN") {
    return true;
  }

  return actorUserId === assignedToId;
}
