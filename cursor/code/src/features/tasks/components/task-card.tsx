"use client";

import type { TaskStatus } from "@prisma/client";
import { useSession } from "next-auth/react";
import { UpdateStatusSelect } from "./update-status-select";
import { ReassignSelect } from "./reassign-select";

interface Employee {
  userId: string;
  user: { name: string; email: string };
}

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    assignedToId: string;
    createdAt: string;
  };
  assigneeName?: string;
  employees?: Employee[];
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export function TaskCard({ task, assigneeName, employees = [] }: TaskCardProps) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const userId = session?.user?.id;
  const isOwnerOrAdmin = role === "OWNER" || role === "ADMIN";
  const canUpdateStatus =
    isOwnerOrAdmin || (role === "EMPLOYEE" && userId === task.assignedToId);

  return (
    <li className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium">{task.title}</h3>
          {task.description ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {task.description}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span
              className="rounded-full bg-zinc-200 px-2 py-0.5 dark:bg-zinc-700"
              title={task.status}
            >
              {STATUS_LABELS[task.status]}
            </span>
            <span>
              Assigned to:{" "}
              {assigneeName ??
                (userId === task.assignedToId ? "You" : task.assignedToId.slice(0, 8))}
            </span>
            <span>
              {new Date(task.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {canUpdateStatus ? (
            <UpdateStatusSelect
              taskId={task.id}
              currentStatus={task.status}
              onSuccess={() => {}}
            />
          ) : null}
          {isOwnerOrAdmin && employees.length > 0 && task.status !== "DONE" ? (
            <ReassignSelect
              taskId={task.id}
              currentAssignedToId={task.assignedToId}
              employees={employees}
              onSuccess={() => {}}
            />
          ) : null}
        </div>
      </div>
    </li>
  );
}
