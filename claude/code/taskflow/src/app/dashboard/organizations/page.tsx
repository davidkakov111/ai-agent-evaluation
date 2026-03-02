"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "@/components/status-badge";

export default function OrganizationsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: orgs, isLoading } = useQuery(trpc.org.list.queryOptions());
  const { data: myRequests } = useQuery(
    trpc.joinRequest.myRequests.queryOptions(),
  );

  const sendRequest = useMutation(
    trpc.joinRequest.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.joinRequest.myRequests.queryKey(),
        });
      },
    }),
  );

  const requestsByOrg = new Map(
    myRequests?.map((r) => [r.organizationId, r.status]) ?? [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground">
          Browse and request to join an organization.
        </p>
      </div>

      {myRequests && myRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Requests</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Organizations</CardTitle>
          <CardDescription>
            Select an organization to request membership.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
          {orgs && orgs.length > 0 ? (
            <div className="space-y-2">
              {orgs.map((org) => {
                const status = requestsByOrg.get(org.id);
                return (
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
                    {status ? (
                      <RequestStatusBadge status={status} />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          sendRequest.mutate({ organizationId: org.id })
                        }
                        disabled={sendRequest.isPending}
                      >
                        Request to Join
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            !isLoading && (
              <p className="text-sm text-muted-foreground">
                No organizations found.
              </p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
