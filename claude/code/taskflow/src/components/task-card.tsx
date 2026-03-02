"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";
import { TaskStatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatus } from "@/lib/constants";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: Date;
    assignee: { id: string; name: string; email: string } | null;
    creator: { id: string; name: string; email: string };
  };
  canChangeStatus: boolean;
}

export function TaskCard({ task, canChangeStatus }: TaskCardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateStatus = useMutation(
    trpc.task.updateStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.task.list.queryKey() });
      },
      onError: () => {
        queryClient.invalidateQueries({ queryKey: trpc.task.list.queryKey() });
      },
    }),
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">{task.title}</CardTitle>
            {task.description && (
              <CardDescription className="line-clamp-2">
                {task.description}
              </CardDescription>
            )}
          </div>
          {canChangeStatus ? (
            <Select
              value={task.status}
              onValueChange={(value) =>
                updateStatus.mutate({ taskId: task.id, status: value as "TODO" | "IN_PROGRESS" | "DONE" })
              }
              disabled={updateStatus.isPending}
            >
              <SelectTrigger className="w-[140px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <TaskStatusBadge status={task.status} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            Assigned to:{" "}
            <span className="text-foreground">
              {task.assignee?.name ?? "Unassigned"}
            </span>
          </span>
          <span>
            Created by:{" "}
            <span className="text-foreground">{task.creator.name}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
