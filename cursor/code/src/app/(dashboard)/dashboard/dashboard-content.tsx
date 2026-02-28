"use client";

import { useSession } from "next-auth/react";
import { TaskList } from "@/features/tasks/components/task-list";
import { CreateTaskForm } from "@/features/tasks/components/create-task-form";
import { PendingJoinRequestsList } from "@/features/join-requests/components/pending-join-requests-list";

export function DashboardContent() {
  const { data: session } = useSession();
  const isOwnerOrAdmin =
    session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  return (
    <div className="mt-8 space-y-8">
      {isOwnerOrAdmin ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Pending join requests</h2>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <PendingJoinRequestsList />
          </div>
        </section>
      ) : null}

      {isOwnerOrAdmin ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Create task</h2>
          <CreateTaskForm />
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Tasks</h2>
        <TaskList />
      </section>
    </div>
  );
}
