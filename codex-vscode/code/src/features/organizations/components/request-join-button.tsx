"use client";

import { TRPCClientError } from "@trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserTrpcClient } from "@/lib/trpc/client";

interface RequestJoinButtonProps {
  organizationId: string;
}

export function RequestJoinButton({ organizationId }: RequestJoinButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const onRequest = async () => {
    setError(null);
    setStatus("submitting");

    try {
      await getBrowserTrpcClient().organization.requestJoin.mutate({ organizationId });
      setStatus("done");
      router.refresh();
    } catch (unknownError: unknown) {
      setStatus("idle");
      if (unknownError instanceof TRPCClientError) {
        setError(unknownError.message);
        return;
      }

      setError("Unable to submit join request.");
    }
  };

  return (
    <div className="stack">
      <button
        className="button button-brand"
        type="button"
        onClick={onRequest}
        disabled={status === "submitting" || status === "done"}
      >
        {status === "idle" ? "Request to join" : null}
        {status === "submitting" ? "Submitting..." : null}
        {status === "done" ? "Request sent" : null}
      </button>
      {error !== null ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
