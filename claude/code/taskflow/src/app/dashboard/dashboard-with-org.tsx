"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskStatus } from "@/lib/constants";

export function DashboardWithOrg() {
  const trpc = useTRPC();
  const { data: tasks } = useQuery(trpc.task.list.queryOptions());
  const { data: org } = useQuery(trpc.org.get.queryOptions());

  const todo = tasks?.filter((t) => t.status === TaskStatus.TODO).length ?? 0;
  const inProgress =
    tasks?.filter((t) => t.status === TaskStatus.IN_PROGRESS).length ?? 0;
  const done = tasks?.filter((t) => t.status === TaskStatus.DONE).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        {org && (
          <p className="text-muted-foreground">{org.name}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>To Do</CardDescription>
            <CardTitle className="text-3xl">{todo}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl">{inProgress}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Done</CardDescription>
            <CardTitle className="text-3xl">{done}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
          <CardDescription>Your latest tasks at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks && tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.assignee?.name ?? "Unassigned"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          )}
          <div className="mt-4">
            <Link href="/dashboard/tasks">
              <Button variant="outline" size="sm">
                View all tasks
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
