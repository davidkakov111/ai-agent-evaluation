"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";
import { createOrgSchema } from "@/lib/validators/org";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequestStatusBadge } from "@/components/status-badge";

export function DashboardNoOrg() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [orgName, setOrgName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const createOrg = useMutation(
    trpc.org.create.mutationOptions({
      onSuccess: () => {
        router.refresh();
      },
      onError: (err) => setCreateError(err.message),
    }),
  );

  const myRequestsOptions = trpc.joinRequest.myRequests.queryOptions();
  const { data: myRequests } = useQuery({
    ...myRequestsOptions,
    refetchInterval: 10_000,
  });

  const hasApprovedRequest = myRequests?.some((r) => r.status === "APPROVED");

  useEffect(() => {
    if (hasApprovedRequest) {
      router.refresh();
    }
  }, [hasApprovedRequest, router]);

  const { data: orgs } = useQuery(trpc.org.list.queryOptions());

  const sendRequest = useMutation(
    trpc.joinRequest.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.joinRequest.myRequests.queryKey(),
        });
      },
    }),
  );

  const pendingOrgIds = new Set(
    myRequests
      ?.filter((r) => r.status === "PENDING")
      .map((r) => r.organizationId) ?? [],
  );

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    const result = createOrgSchema.safeParse({ name: orgName });
    if (!result.success) {
      setCreateError(result.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    createOrg.mutate(result.data);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome to TaskFlow
        </h1>
        <p className="text-muted-foreground">
          Create or join an organization to get started.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Organization</CardTitle>
            <CardDescription>
              Start your own organization and become the owner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {createError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {createError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="My Organization"
                  required
                />
              </div>
              <Button type="submit" disabled={createOrg.isPending}>
                {createOrg.isPending ? "Creating..." : "Create"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Join Requests</CardTitle>
            <CardDescription>
              Track the status of your pending requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myRequests && myRequests.length > 0 ? (
              <div className="space-y-2">
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <span className="text-sm font-medium">
                      {req.organization.name}
                    </span>
                    <RequestStatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No requests yet. Browse organizations below.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Organizations</CardTitle>
          <CardDescription>
            Request to join an existing organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orgs && orgs.length > 0 ? (
            <div className="space-y-2">
              {orgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {org._count.members}{" "}
                      {org._count.members === 1 ? "member" : "members"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      sendRequest.mutate({ organizationId: org.id })
                    }
                    disabled={
                      pendingOrgIds.has(org.id) || sendRequest.isPending
                    }
                  >
                    {pendingOrgIds.has(org.id) ? "Requested" : "Request to Join"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No organizations found. Create one above!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
