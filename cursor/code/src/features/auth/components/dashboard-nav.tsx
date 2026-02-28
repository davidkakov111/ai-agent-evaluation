"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { SignOutButton } from "./sign-out-button";

export function DashboardNav() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center gap-4">
      {session?.user.organizationId !== null ? (
        <Link
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          href="/dashboard"
        >
          Dashboard
        </Link>
      ) : null}
      <Link
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        href="/organizations"
      >
        Organizations
      </Link>
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        {session?.user?.name ?? session?.user?.email ?? "User"}
      </span>
      <SignOutButton className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        Sign out
      </SignOutButton>
    </nav>
  );
}
