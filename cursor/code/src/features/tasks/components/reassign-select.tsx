"use client";

import { TRPCClientError } from "@trpc/client";
import { trpc } from "@/lib/trpc/client";

interface Employee {
  userId: string;
  user: { name: string; email: string };
}

interface ReassignSelectProps {
  taskId: string;
  currentAssignedToId: string;
  employees: Employee[];
  onSuccess?: () => void;
}

export function ReassignSelect({
  taskId,
  currentAssignedToId,
  employees,
  onSuccess,
}: ReassignSelectProps) {
  const utils = trpc.useUtils();
  const reassignMutation = trpc.task.reassign.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      onSuccess?.();
    },
  });

  const options = employees.filter((e) => e.userId !== currentAssignedToId);

  if (options.length === 0) {
    return null;
  }

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const assignedToUserId = event.target.value;
    if (!assignedToUserId) return;
    reassignMutation.reset();
    reassignMutation.mutate({ taskId, assignedToUserId });
  };

  const error =
    reassignMutation.error instanceof TRPCClientError
      ? reassignMutation.error.message
      : reassignMutation.error
        ? "Failed to reassign."
        : null;

  return (
    <div className="flex flex-col gap-1">
    <select
      className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
      value=""
      onChange={handleChange}
      disabled={reassignMutation.isPending}
      aria-label="Reassign task"
    >
      <option value="">Reassign</option>
      {options.map((emp) => (
        <option key={emp.userId} value={emp.userId}>
          {emp.user.name ?? emp.user.email}
        </option>
      ))}
    </select>
    {error !== null ? (
      <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
    ) : null}
    </div>
  );
}
