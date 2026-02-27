"use client";

import { TRPCClientError } from "@trpc/client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserTrpcClient } from "@/lib/trpc/client";

type AppRole = "OWNER" | "ADMIN" | "EMPLOYEE";
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

interface TaskItem {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  assignedToId: string;
  createdById: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeOption {
  userId: string;
  label: string;
}

interface TaskListPanelProps {
  role: AppRole;
  tasks: TaskItem[];
  employees: EmployeeOption[];
}

const transitionOptions: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["DONE"],
  DONE: [],
};

function buildNextStatusMap(tasks: TaskItem[]): Record<string, TaskStatus> {
  return Object.fromEntries(
    tasks.map((task) => [task.id, transitionOptions[task.status][0] ?? task.status]),
  );
}

function buildCurrentStatusMap(tasks: TaskItem[]): Record<string, TaskStatus> {
  return Object.fromEntries(tasks.map((task) => [task.id, task.status]));
}

function buildAssigneeMap(tasks: TaskItem[]): Record<string, string> {
  return Object.fromEntries(tasks.map((task) => [task.id, task.assignedToId]));
}

export function TaskListPanel({ role, tasks, employees }: TaskListPanelProps) {
  const router = useRouter();
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStatusByTaskId, setCurrentStatusByTaskId] = useState<Record<string, TaskStatus>>(
    buildCurrentStatusMap(tasks),
  );
  const [nextStatusByTaskId, setNextStatusByTaskId] = useState<Record<string, TaskStatus>>(
    buildNextStatusMap(tasks),
  );
  const [assigneeByTaskId, setAssigneeByTaskId] = useState<Record<string, string>>(buildAssigneeMap(tasks));

  useEffect(() => {
    setCurrentStatusByTaskId(buildCurrentStatusMap(tasks));
    setNextStatusByTaskId(buildNextStatusMap(tasks));
    setAssigneeByTaskId(buildAssigneeMap(tasks));
  }, [tasks]);

  const employeeLabelById = useMemo(
    () => Object.fromEntries(employees.map((employee) => [employee.userId, employee.label])),
    [employees],
  );

  const onUpdateStatus = async (taskId: string) => {
    setError(null);
    setBusyTaskId(taskId);
    const currentStatus = currentStatusByTaskId[taskId];
    const nextStatus = nextStatusByTaskId[taskId];

    if (currentStatus === undefined || nextStatus === undefined) {
      setBusyTaskId(null);
      setError("Task state is out of sync. Please refresh.");
      return;
    }

    try {
      await getBrowserTrpcClient().task.updateStatus.mutate({
        taskId,
        status: nextStatus,
      });

      setCurrentStatusByTaskId((prev) => ({
        ...prev,
        [taskId]: nextStatus,
      }));
      setNextStatusByTaskId((prev) => ({
        ...prev,
        [taskId]: transitionOptions[nextStatus][0] ?? nextStatus,
      }));
      setBusyTaskId(null);
      router.refresh();
    } catch (unknownError: unknown) {
      setBusyTaskId(null);
      if (unknownError instanceof TRPCClientError) {
        setError(unknownError.message);
        return;
      }

      setError("Unable to update task status.");
    }
  };

  const onReassign = async (taskId: string) => {
    setError(null);
    setBusyTaskId(taskId);

    try {
      const assignedToUserId = assigneeByTaskId[taskId];
      if (assignedToUserId === undefined) {
        setBusyTaskId(null);
        setError("Please choose an assignee before saving.");
        return;
      }

      await getBrowserTrpcClient().task.reassign.mutate({
        taskId,
        assignedToUserId,
      });

      setBusyTaskId(null);
      router.refresh();
    } catch (unknownError: unknown) {
      setBusyTaskId(null);
      if (unknownError instanceof TRPCClientError) {
        setError(unknownError.message);
        return;
      }

      setError("Unable to reassign task.");
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="surface p-5">
        <h2 className="mb-2 text-lg font-bold">Tasks</h2>
        <p className="text-sm text-[var(--ink-soft)]">No tasks yet.</p>
      </div>
    );
  }

  return (
    <div className="surface p-5">
      <h2 className="mb-3 text-lg font-bold">Tasks</h2>
      {error !== null ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left">
              <th className="p-2">Task</th>
              <th className="p-2">Assigned To</th>
              <th className="p-2">Status</th>
              <th className="p-2">Updated</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b border-[var(--line)]/70 align-top">
                {(() => {
                  const currentStatus = currentStatusByTaskId[task.id] ?? task.status;
                  const allowedTransitions = transitionOptions[currentStatus];
                  const selectedNextStatus =
                    nextStatusByTaskId[task.id] ?? allowedTransitions[0] ?? currentStatus;

                  return (
                    <>
                <td className="p-2">
                  <p className="font-semibold">{task.title}</p>
                  {task.description !== null ? (
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">{task.description}</p>
                  ) : null}
                </td>
                <td className="p-2">
                  {role === "OWNER" || role === "ADMIN" ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="input"
                        value={assigneeByTaskId[task.id] ?? task.assignedToId}
                        onChange={(event) =>
                          setAssigneeByTaskId((prev) => ({
                            ...prev,
                            [task.id]: event.target.value,
                          }))
                        }
                      >
                        {employees.map((employee) => (
                          <option key={employee.userId} value={employee.userId}>
                            {employee.label}
                          </option>
                        ))}
                      </select>
                      <button
                        className="button button-outline"
                        type="button"
                        disabled={busyTaskId === task.id}
                        onClick={() => {
                          void onReassign(task.id);
                        }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <span>{role === "EMPLOYEE" ? "You" : (employeeLabelById[task.assignedToId] ?? "Unknown")}</span>
                  )}
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold">
                      {currentStatus}
                    </span>
                    <select
                      className="input"
                      value={selectedNextStatus}
                      onChange={(event) =>
                        setNextStatusByTaskId((prev) => ({
                          ...prev,
                          [task.id]: event.target.value as TaskStatus,
                        }))
                      }
                    >
                      {allowedTransitions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="p-2">{new Date(task.updatedAt).toLocaleString()}</td>
                <td className="p-2">
                  <button
                    className="button button-brand"
                    type="button"
                    disabled={busyTaskId === task.id || allowedTransitions.length === 0}
                    onClick={() => {
                      void onUpdateStatus(task.id);
                    }}
                  >
                    Update
                  </button>
                </td>
                    </>
                  );
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
