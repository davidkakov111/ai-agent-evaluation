"use client";

import type { TaskStatus } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";
import { trpc } from "@/lib/trpc/client";

const STATUS_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["DONE"],
  DONE: [],
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

interface UpdateStatusSelectProps {
  taskId: string;
  currentStatus: TaskStatus;
  onSuccess?: () => void;
}

export function UpdateStatusSelect({
  taskId,
  currentStatus,
  onSuccess,
}: UpdateStatusSelectProps) {
  const utils = trpc.useUtils();
  const allowed = STATUS_TRANSITIONS[currentStatus];
  const updateMutation = trpc.task.updateStatus.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      onSuccess?.();
    },
  });

  if (allowed.length === 0) {
    return null;
  }

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as TaskStatus;
    if (!next) return;
    updateMutation.reset();
    updateMutation.mutate({ taskId, status: next });
  };

  const error =
    updateMutation.error instanceof TRPCClientError
      ? updateMutation.error.message
      : updateMutation.error
        ? "Failed to update status."
        : null;

  return (
    <div className="flex flex-col gap-1">
    <select
      className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
      value=""
      onChange={handleChange}
      disabled={updateMutation.isPending}
      aria-label="Update task status"
    >
      <option value="">Update status</option>
      {allowed.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
    {error !== null ? (
      <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
    ) : null}
    </div>
  );
}
