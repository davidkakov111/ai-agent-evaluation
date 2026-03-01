"use client";

import { TRPCClientError } from "@trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserTrpcClient } from "@/lib/trpc/client";

type AppRole = "OWNER" | "ADMIN" | "EMPLOYEE";

interface PendingJoinRequest {
  id: string;
  userId: string;
  organizationId: string;
  status: "PENDING";
  requestedRole: AppRole;
  createdAt: string;
  user: {
    email: string;
    name: string;
  };
}

interface PendingJoinRequestsPanelProps {
  items: PendingJoinRequest[];
}

export function PendingJoinRequestsPanel({ items }: PendingJoinRequestsPanelProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [roleByRequestId, setRoleByRequestId] = useState<Record<string, AppRole>>(
    Object.fromEntries(items.map((item) => [item.id, item.requestedRole])),
  );
  const [error, setError] = useState<string | null>(null);

  const onApprove = async (joinRequestId: string) => {
    setError(null);
    setBusyId(joinRequestId);

    try {
      const role = roleByRequestId[joinRequestId] ?? "EMPLOYEE";
      await getBrowserTrpcClient().joinRequest.approve.mutate({
        joinRequestId,
        role,
      });
      setBusyId(null);
      router.refresh();
    } catch (unknownError: unknown) {
      setBusyId(null);
      if (unknownError instanceof TRPCClientError) {
        setError(unknownError.message);
        return;
      }

      setError("Unable to approve join request.");
    }
  };

  const onReject = async (joinRequestId: string) => {
    setError(null);
    setBusyId(joinRequestId);

    try {
      await getBrowserTrpcClient().joinRequest.reject.mutate({ joinRequestId });
      setBusyId(null);
      router.refresh();
    } catch (unknownError: unknown) {
      setBusyId(null);
      if (unknownError instanceof TRPCClientError) {
        setError(unknownError.message);
        return;
      }

      setError("Unable to reject join request.");
    }
  };

  if (items.length === 0) {
    return (
      <div className="surface p-5">
        <h2 className="mb-2 text-lg font-bold">Pending Join Requests</h2>
        <p className="text-sm text-[var(--ink-soft)]">No pending requests right now.</p>
      </div>
    );
  }

  return (
    <div className="surface p-5">
      <h2 className="mb-3 text-lg font-bold">Pending Join Requests</h2>
      {error !== null ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Requested</th>
              <th className="p-2">Assign Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-[var(--line)]/70">
                <td className="p-2">{item.user.name}</td>
                <td className="p-2">{item.user.email}</td>
                <td className="p-2">{new Date(item.createdAt).toLocaleString()}</td>
                <td className="p-2">
                  <select
                    className="input"
                    value={roleByRequestId[item.id] ?? "EMPLOYEE"}
                    onChange={(event) =>
                      setRoleByRequestId((prev) => ({
                        ...prev,
                        [item.id]: event.target.value as AppRole,
                      }))
                    }
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button
                      className="button button-brand"
                      type="button"
                      onClick={() => {
                        void onApprove(item.id);
                      }}
                      disabled={busyId === item.id}
                    >
                      Approve
                    </button>
                    <button
                      className="button button-outline"
                      type="button"
                      onClick={() => {
                        void onReject(item.id);
                      }}
                      disabled={busyId === item.id}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
