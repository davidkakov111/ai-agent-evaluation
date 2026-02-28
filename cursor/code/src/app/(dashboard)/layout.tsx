import Link from "next/link";
import { requireAuthenticatedSession } from "@/server/auth";
import { DashboardNav } from "@/features/auth/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAuthenticatedSession();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold">
            TaskFlow
          </Link>
          <DashboardNav />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
