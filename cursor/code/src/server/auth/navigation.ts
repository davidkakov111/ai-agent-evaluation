import { redirect } from "next/navigation";
import { getAuthSession } from "@/server/auth/session";
import type { AppRole, AppSession } from "@/server/auth/types";

function getLandingPathForSession(session: AppSession): string {
  if (session.user.organizationId === null) {
    return "/organizations";
  }

  return "/dashboard";
}

export async function redirectIfAuthenticated(): Promise<void> {
  const session = await getAuthSession();
  if (session !== null) {
    redirect(getLandingPathForSession(session));
  }
}

export async function requireAuthenticatedSession(): Promise<AppSession> {
  const session = await getAuthSession();

  if (session === null) {
    redirect("/login");
  }

  return session;
}

export async function requireMembershipSession(): Promise<AppSession> {
  const session = await requireAuthenticatedSession();

  if (session.user.organizationId === null || session.user.role === null) {
    redirect("/organizations");
  }

  return session;
}

export interface MembershipSession extends AppSession {
  user: AppSession["user"] & {
    organizationId: string;
    role: AppRole;
  };
}

export async function requireMembershipSessionStrict(): Promise<MembershipSession> {
  const session = await requireMembershipSession();

  return session as MembershipSession;
}
