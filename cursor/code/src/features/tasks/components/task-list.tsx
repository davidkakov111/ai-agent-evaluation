"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { TaskCard } from "./task-card";

interface Employee {
  userId: string;
  user: { name: string; email: string };
}

export function TaskList() {
  const { data: session } = useSession();
  const { data, isLoading, error } = trpc.task.list.useQuery();
  const { data: membersData } = trpc.organization.members.useQuery(
    { role: "EMPLOYEE" },
    { enabled: session?.user?.role === "OWNER" || session?.user?.role === "ADMIN" },
  );

  const employees: Employee[] = membersData?.items ?? [];
  const assigneeMap = new Map(
    employees.map((e) => [e.userId, e.user.name ?? e.user.email]),
  );

  if (isLoading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading tasks...</p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Failed to load tasks.
      </p>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No tasks yet. Create one to get started.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((task) => (
        <TaskCard
          key={task.id}
          task={{
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            assignedToId: task.assignedToId,
            createdAt: task.createdAt,
          }}
          assigneeName={assigneeMap.get(task.assignedToId)}
          employees={employees}
        />
      ))}
    </ul>
  );
}
