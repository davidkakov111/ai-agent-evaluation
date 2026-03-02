export const MemberRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];

export const ADMIN_ROLES: readonly MemberRole[] = [
  MemberRole.OWNER,
  MemberRole.ADMIN,
] as const;

export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const JoinRequestStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type JoinRequestStatus =
  (typeof JoinRequestStatus)[keyof typeof JoinRequestStatus];
