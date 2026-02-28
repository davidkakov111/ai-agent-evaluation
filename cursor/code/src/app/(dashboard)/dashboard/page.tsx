import { requireMembershipSessionStrict } from "@/server/auth";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  await requireMembershipSessionStrict();

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Manage your tasks.
      </p>
      <DashboardContent />
    </div>
  );
}
