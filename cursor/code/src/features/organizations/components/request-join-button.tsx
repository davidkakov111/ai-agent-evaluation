"use client";

import { TRPCClientError } from "@trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

interface RequestJoinButtonProps {
  organizationId: string;
}

export function RequestJoinButton({ organizationId }: RequestJoinButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const utils = trpc.useUtils();
  const requestJoinMutation = trpc.organization.requestJoin.useMutation({
    onSuccess: () => {
      utils.organization.listPublic.invalidate();
      setStatus("done");
      router.refresh();
    },
    onError: () => {
      setStatus("idle");
    },
  });

  const onRequest = () => {
    setStatus("submitting");
    requestJoinMutation.mutate({ organizationId });
  };

  const error =
    requestJoinMutation.error instanceof TRPCClientError
      ? requestJoinMutation.error.message
      : requestJoinMutation.error
        ? "Unable to submit join request."
        : null;

  return (
    <div className="flex flex-col gap-1">
      <button
        className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        type="button"
        onClick={onRequest}
        disabled={status === "submitting" || status === "done"}
      >
        {status === "idle" ? "Request to join" : null}
        {status === "submitting" ? "Submitting..." : null}
        {status === "done" ? "Request sent" : null}
      </button>
      {error !== null ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
