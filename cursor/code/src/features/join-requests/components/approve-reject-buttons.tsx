"use client";

import { TRPCClientError } from "@trpc/client";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

interface ApproveRejectButtonsProps {
  joinRequestId: string;
  onSuccess?: () => void;
}

const ROLES = ["EMPLOYEE", "ADMIN"] as const;

export function ApproveRejectButtons({
  joinRequestId,
  onSuccess,
}: ApproveRejectButtonsProps) {
  const [selectedRole, setSelectedRole] = useState<"EMPLOYEE" | "ADMIN">(
    "EMPLOYEE",
  );

  const utils = trpc.useUtils();
  const approveMutation = trpc.joinRequest.approve.useMutation({
    onSuccess: () => {
      utils.joinRequest.listPending.invalidate();
      utils.organization.members.invalidate();
      onSuccess?.();
    },
  });

  const rejectMutation = trpc.joinRequest.reject.useMutation({
    onSuccess: () => {
      utils.joinRequest.listPending.invalidate();
      onSuccess?.();
    },
  });

  const approve = () => {
    approveMutation.mutate({ joinRequestId, role: selectedRole });
  };

  const reject = () => {
    rejectMutation.mutate({ joinRequestId });
  };

  const isPending = approveMutation.isPending || rejectMutation.isPending;
  const error =
    approveMutation.error instanceof TRPCClientError
      ? approveMutation.error.message
      : rejectMutation.error instanceof TRPCClientError
        ? rejectMutation.error.message
        : approveMutation.error || rejectMutation.error
          ? "Operation failed."
          : null;

  return (
    <div className="flex flex-col items-end gap-2">
      <select
        className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        value={selectedRole}
        onChange={(e) =>
          setSelectedRole(e.target.value as "EMPLOYEE" | "ADMIN")
        }
        disabled={isPending}
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          className="rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          type="button"
          onClick={approve}
          disabled={isPending}
        >
          Approve
        </button>
        <button
          className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          type="button"
          onClick={reject}
          disabled={isPending}
        >
          Reject
        </button>
      </div>
      {error !== null ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
