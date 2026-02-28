import Link from "next/link";
import { getAuthSession } from "@/server/auth/session";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

export default async function HomePage() {
  const session = await getAuthSession();

  if (session === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <h1 className="text-3xl font-bold">TaskFlow</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Multi-tenant task management platform
        </p>
        <div className="flex gap-4">
          <Link
            className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            href="/login"
          >
            Sign in
          </Link>
          <Link
            className="rounded-md border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
            href="/register"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  const landingPath =
    session.user.organizationId === null ? "/organizations" : "/dashboard";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold">TaskFlow</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Welcome, {session.user.name ?? session.user.email}
      </p>
      <div className="flex gap-4">
        <Link
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          href={landingPath}
        >
          Continue
        </Link>
        <SignOutButton className="rounded-md border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800">
          Sign out
        </SignOutButton>
      </div>
    </div>
  );
}
