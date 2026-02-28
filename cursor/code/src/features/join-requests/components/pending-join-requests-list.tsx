"use client";

import { trpc } from "@/lib/trpc/client";
import { ApproveRejectButtons } from "./approve-reject-buttons";

export function PendingJoinRequestsList() {
  const { data, isLoading, error } = trpc.joinRequest.listPending.useQuery();

  if (isLoading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading...</p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Failed to load join requests.
      </p>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No pending join requests.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {items.map((req) => (
        <li
          key={req.id}
          className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
        >
          <div>
            <p className="font-medium">{req.user.name ?? req.user.email}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {req.user.email}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Requested role: {req.requestedRole}
            </p>
          </div>
          <ApproveRejectButtons joinRequestId={req.id} />
        </li>
      ))}
    </ul>
  );
}
