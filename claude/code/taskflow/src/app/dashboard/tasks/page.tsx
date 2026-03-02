"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";
import { ADMIN_ROLES, TaskStatus, type MemberRole } from "@/lib/constants";
import { TaskCard } from "@/components/task-card";
import { TaskForm } from "@/components/task-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const ALL_STATUSES = "ALL";

export default function TasksPage() {
  const { data: session } = useSession();
  const trpc = useTRPC();
  const { data: tasks, isLoading } = useQuery(trpc.task.list.queryOptions());

  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [search, setSearch] = useState("");

  const isAdmin =
    !!session?.user.role &&
    ADMIN_ROLES.includes(session.user.role as MemberRole);

  const filteredTasks = tasks?.filter((task) => {
    if (statusFilter !== ALL_STATUSES && task.status !== statusFilter)
      return false;
    if (
      search &&
      !task.title.toLowerCase().includes(search.toLowerCase()) &&
      !task.description?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Manage and assign tasks to your team."
              : "View and update your assigned tasks."}
          </p>
        </div>
        {isAdmin && <TaskForm />}
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All Statuses</SelectItem>
            <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
            <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Loading tasks...</p>
      )}

      {filteredTasks && filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canChangeStatus={
                isAdmin || task.assignee?.id === session?.user.id
              }
            />
          ))}
        </div>
      ) : (
        !isLoading && (
          <p className="text-sm text-muted-foreground">
            No tasks match your filters.
          </p>
        )
      )}
    </div>
  );
}
