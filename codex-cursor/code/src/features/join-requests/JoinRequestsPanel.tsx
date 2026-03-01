"use client";

import { OrgRole } from "@prisma/client";
import { useState } from "react";

import { trpc } from "@/lib/trpc/react";

type JoinRequestsPanelProps = {
  canManage: boolean;
};

export function JoinRequestsPanel(props: JoinRequestsPanelProps) {
  const utils = trpc.useUtils();
  const joinRequestsQuery = trpc.joinRequest.list.useQuery();
  const approveMutation = trpc.joinRequest.approve.useMutation({
    onSuccess: async () => {
      await utils.joinRequest.list.invalidate();
      await utils.auth.me.invalidate();
    },
  });
  const rejectMutation = trpc.joinRequest.reject.useMutation({
    onSuccess: async () => {
      await utils.joinRequest.list.invalidate();
    },
  });

  const [assignedRole, setAssignedRole] = useState<OrgRole>(OrgRole.EMPLOYEE);
  const [actionError, setActionError] = useState<string | null>(null);

  function formatMutationError(error: unknown): string {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }
    return "Could not complete join request action.";
  }

  if (joinRequestsQuery.isLoading) {
    return <p className="panel">Loading join requests...</p>;
  }

  if (joinRequestsQuery.error) {
    return <p className="banner error">Failed to load join requests.</p>;
  }

  if (!joinRequestsQuery.data || joinRequestsQuery.data.length === 0) {
    return <p className="panel muted">No join requests found.</p>;
  }

  return (
    <section className="panel stack-sm">
      <h2>Join requests</h2>
      {actionError ? <p className="banner error">{actionError}</p> : null}
      <ul className="stack-sm">
        {joinRequestsQuery.data.map((request) => (
          <li key={request.id} className="panel inner stack-xs">
            <p>
              <strong>User:</strong> {request.userId}
            </p>
            <p>
              <strong>Status:</strong> {request.status}
            </p>
            <p>
              <strong>Requested role:</strong> {request.requestedRole}
            </p>

            {props.canManage && request.status === "PENDING" ? (
              <div className="row gap-sm wrap">
                <select
                  className="input join-role-select"
                  value={assignedRole}
                  onChange={(event) => setAssignedRole(event.target.value as OrgRole)}
                >
                  <option value={OrgRole.ADMIN}>
                    ADMIN
                  </option>
                  <option value={OrgRole.EMPLOYEE}>
                    EMPLOYEE
                  </option>
                </select>
                <button
                  className="button"
                  type="button"
                  onClick={async () => {
                    setActionError(null);
                    try {
                      await approveMutation.mutateAsync({
                        joinRequestId: request.id,
                        assignedRole,
                      });
                    } catch (error: unknown) {
                      setActionError(formatMutationError(error));
                    }
                  }}
                  disabled={approveMutation.isPending}
                >
                  Approve
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={async () => {
                    setActionError(null);
                    try {
                      await rejectMutation.mutateAsync({ joinRequestId: request.id });
                    } catch (error: unknown) {
                      setActionError(formatMutationError(error));
                    }
                  }}
                  disabled={rejectMutation.isPending}
                >
                  Reject
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
