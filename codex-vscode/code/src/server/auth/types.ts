export const appRoles = ["OWNER", "ADMIN", "EMPLOYEE"] as const;
export type AppRole = (typeof appRoles)[number];

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  organizationId: string | null;
  role: AppRole | null;
}

export interface AppSession {
  user: SessionUser;
}
