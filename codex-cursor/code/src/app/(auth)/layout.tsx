import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/server/auth/session";

export default async function AuthLayout(props: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (session?.user?.id) {
    if (session.user.organizationId) {
      redirect("/dashboard");
    }
    redirect("/onboarding");
  }

  return (
    <main className="screen stack-md">
      <header className="stack-xs">
        <h1>TaskFlow</h1>
        <p className="muted">A multi-tenant task management workspace.</p>
      </header>
      {props.children}
      <p className="muted">
        <Link href="/login">Sign in</Link> · <Link href="/register">Create account</Link>
      </p>
    </main>
  );
}
