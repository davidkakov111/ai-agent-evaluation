"use client";

import { TaskStatus } from "@prisma/client";
import { useState } from "react";

import { trpc } from "@/lib/trpc/react";

type TaskWorkspaceProps = {
  canManage: boolean;
};

export function TaskWorkspace(props: TaskWorkspaceProps) {
  const utils = trpc.useUtils();
  const tasksQuery = trpc.task.list.useQuery();

  const createTask = trpc.task.create.useMutation({
    onSuccess: async () => {
      await utils.task.list.invalidate();
      setTitle("");
      setDescription("");
      setAssignedToId("");
    },
  });

  const assignTask = trpc.task.assign.useMutation({
    onSuccess: async () => {
      await utils.task.list.invalidate();
    },
  });

  const updateStatus = trpc.task.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.task.list.invalidate();
    },
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  if (tasksQuery.isLoading) {
    return <p className="panel">Loading tasks...</p>;
  }

  if (tasksQuery.error) {
    return <p className="banner error">Failed to load tasks.</p>;
  }

  async function onCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);

    try {
      await createTask.mutateAsync({
        title,
        description,
        assignedToId,
        status: TaskStatus.TODO,
      });
    } catch {
      setCreateError("Could not create task. Verify assignee ID and permissions.");
    }
  }

  return (
    <section className="stack-md">
      {props.canManage ? (
        <form className="panel stack-sm" onSubmit={onCreateTask}>
          <h2>Create task</h2>
          <label className="stack-xs">
            <span>Title</span>
            <input
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label className="stack-xs">
            <span>Description</span>
            <textarea
              className="input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </label>
          <label className="stack-xs">
            <span>Assign to employee ID</span>
            <input
              className="input"
              value={assignedToId}
              onChange={(event) => setAssignedToId(event.target.value)}
              required
            />
          </label>
          {createError ? <p className="banner error">{createError}</p> : null}
          <button className="button" type="submit" disabled={createTask.isPending}>
            {createTask.isPending ? "Creating..." : "Create task"}
          </button>
        </form>
      ) : null}

      {!tasksQuery.data || tasksQuery.data.length === 0 ? (
        <p className="panel muted">No tasks available.</p>
      ) : (
        <ul className="stack-sm">
          {tasksQuery.data.map((task) => (
            <li key={task.id} className="panel inner stack-xs">
              <p>
                <strong>{task.title}</strong>
              </p>
              <p className="muted">{task.description}</p>
              <p>
                <strong>Assigned:</strong> {task.assignedToId}
              </p>
              <p>
                <strong>Status:</strong> {task.status}
              </p>
              <div className="row gap-sm wrap">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() =>
                    updateStatus.mutate({ taskId: task.id, status: TaskStatus.TODO })
                  }
                  disabled={updateStatus.isPending}
                >
                  TODO
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() =>
                    updateStatus.mutate({
                      taskId: task.id,
                      status: TaskStatus.IN_PROGRESS,
                    })
                  }
                  disabled={updateStatus.isPending}
                >
                  IN_PROGRESS
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() =>
                    updateStatus.mutate({ taskId: task.id, status: TaskStatus.DONE })
                  }
                  disabled={updateStatus.isPending}
                >
                  DONE
                </button>
              </div>

              {props.canManage ? (
                <AssignTaskInline
                  onAssign={(nextAssignedToId) => {
                    assignTask.mutate({
                      taskId: task.id,
                      assignedToId: nextAssignedToId,
                    });
                  }}
                  isPending={assignTask.isPending}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AssignTaskInline(props: {
  onAssign: (assignedToId: string) => void;
  isPending: boolean;
}) {
  const [assignedToId, setAssignedToId] = useState("");

  return (
    <form
      className="row gap-sm wrap"
      onSubmit={(event) => {
        event.preventDefault();
        props.onAssign(assignedToId);
        setAssignedToId("");
      }}
    >
      <input
        className="input"
        placeholder="New assignee user ID"
        value={assignedToId}
        onChange={(event) => setAssignedToId(event.target.value)}
        required
      />
      <button className="button secondary" type="submit" disabled={props.isPending}>
        Reassign
      </button>
    </form>
  );
}
