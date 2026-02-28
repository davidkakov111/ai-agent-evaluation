"use client";

import { TRPCClientError } from "@trpc/client";
import { trpc } from "@/lib/trpc/client";

export function CreateTaskForm() {
  const { data: membersData, isLoading: membersLoading } =
    trpc.organization.members.useQuery({ role: "EMPLOYEE" });
  const utils = trpc.useUtils();
  const createMutation = trpc.task.create.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
    },
  });

  const employees = membersData?.items ?? [];
  const assigneeOptions = employees.map((m) => ({
    userId: m.userId,
    label: m.user.name ?? m.user.email,
  }));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.reset();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const assignedToUserId = formData.get("assignedToUserId") as string;

    if (!title || !assignedToUserId) return;

    createMutation.mutate(
      {
        title,
        description: description === "" ? undefined : description,
        assignedToUserId,
      },
      {
        onSuccess: () => {
          form.reset();
        },
      },
    );
  };

  const error =
    createMutation.error instanceof TRPCClientError
      ? createMutation.error.message
      : createMutation.error
        ? "Unable to create task."
        : null;

  if (employees.length === 0 && !membersLoading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No employees in your organization. Add members before creating tasks.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      onSubmit={onSubmit}
    >
      <h2 className="text-lg font-bold">Create Task</h2>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
          htmlFor="task-title"
        >
          Title
        </label>
        <input
          id="task-title"
          name="title"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          type="text"
          required
          maxLength={200}
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
          htmlFor="task-description"
        >
          Description (optional)
        </label>
        <textarea
          id="task-description"
          name="description"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          rows={3}
          maxLength={5000}
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
          htmlFor="task-assignee"
        >
          Assign to
        </label>
        <select
          id="task-assignee"
          name="assignedToUserId"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          required
          disabled={membersLoading}
        >
          <option value="">Select employee</option>
          {assigneeOptions.map((opt) => (
            <option key={opt.userId} value={opt.userId}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error !== null ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <button
        className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        type="submit"
        disabled={createMutation.isPending || membersLoading}
      >
        {createMutation.isPending ? "Creating..." : "Create task"}
      </button>
    </form>
  );
}
