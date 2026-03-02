"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ADMIN_ROLES, type MemberRole } from "@/lib/constants";
import { MemberList } from "@/components/member-list";
import { JoinRequestList } from "@/components/join-request-list";

export default function OrganizationPage() {
  const { data: session } = useSession();
  const trpc = useTRPC();
  const { data: org, isLoading } = useQuery(trpc.org.get.queryOptions());

  const isAdmin =
    !!session?.user.role &&
    ADMIN_ROLES.includes(session.user.role as MemberRole);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (!org) {
    return <p className="text-muted-foreground">Organization not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
        <p className="text-muted-foreground">
          Manage your organization and its members.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Members</CardTitle>
          <CardDescription>
            All members of your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberList />
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Join Requests</CardTitle>
            <CardDescription>
              Review and approve or reject membership requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JoinRequestList />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
