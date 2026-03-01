import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/features/auth/SignOutButton";
import { getAuthSession } from "@/server/auth/session";

export default async function AppLayout(props: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const hasOrganization = Boolean(session.user.organizationId);

  return (
    <div className="screen stack-md">
      <header className="row space-between wrap">
        <div className="stack-xs">
          <h1>TaskFlow</h1>
          <p className="muted">Signed in as {session.user.name ?? session.user.email}</p>
        </div>
        <SignOutButton />
      </header>
      <nav className="row gap-sm wrap">
        <Link href={hasOrganization ? "/dashboard" : "/onboarding"} className="button secondary">
          {hasOrganization ? "Dashboard" : "Onboarding"}
        </Link>
        {hasOrganization ? (
          <>
            <Link href="/tasks" className="button secondary">
              Tasks
            </Link>
            <Link href="/join-requests" className="button secondary">
              Join requests
            </Link>
          </>
        ) : null}
      </nav>
      {props.children}
    </div>
  );
}
