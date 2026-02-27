"use client";

import { TRPCClientError } from "@trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserTrpcClient } from "@/lib/trpc/client";

interface EmployeeOption {
  userId: string;
  label: string;
}

interface CreateTaskFormProps {
  employees: EmployeeOption[];
}

export function CreateTaskForm({ employees }: CreateTaskFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToUserId, setAssignedToUserId] = useState(employees[0]?.userId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (employees.length === 0) {
    return (
      <div className="surface p-5">
        <h2 className="mb-2 text-lg font-bold">Create Task</h2>
        <p className="text-sm text-[var(--ink-soft)]">
          You need at least one employee in the organization before assigning tasks.
        </p>
      </div>
    );
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const effectiveAssignedToUserId = employees.some(
      (employee) => employee.userId === assignedToUserId,
    )
      ? assignedToUserId
      : (employees[0]?.userId ?? "");

    if (effectiveAssignedToUserId === "") {
      setError("Please select an employee.");
      setIsSubmitting(false);
      return;
    }

    try {
      await getBrowserTrpcClient().task.create.mutate({
        title,
        description: description.trim() === "" ? null : description,
        assignedToUserId: effectiveAssignedToUserId,
      });

      setTitle("");
      setDescription("");
      setIsSubmitting(false);
      router.refresh();
    } catch (unknownError: unknown) {
      setIsSubmitting(false);

      if (unknownError instanceof TRPCClientError) {
        setError(unknownError.message);
        return;
      }

      setError("Unable to create task.");
    }
  };

  return (
    <form className="surface stack p-5" onSubmit={onSubmit}>
      <h2 className="text-lg font-bold">Create Task</h2>
      <div>
        <label className="label" htmlFor="new-task-title">
          Title
        </label>
        <input
          id="new-task-title"
          className="input"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="new-task-description">
          Description
        </label>
        <textarea
          id="new-task-description"
          className="input min-h-24 resize-y"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="new-task-assignee">
          Assigned Employee
        </label>
        <select
          id="new-task-assignee"
          className="input"
          value={assignedToUserId}
          onChange={(event) => setAssignedToUserId(event.target.value)}
        >
          {employees.map((employee) => (
            <option key={employee.userId} value={employee.userId}>
              {employee.label}
            </option>
          ))}
        </select>
      </div>
      {error !== null ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className="button button-brand" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Creating..." : "Create task"}
      </button>
    </form>
  );
}
