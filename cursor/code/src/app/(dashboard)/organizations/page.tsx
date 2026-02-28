"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";
import { CreateOrganizationForm } from "@/features/organizations/components/create-organization-form";
import { OrgList } from "@/features/organizations/components/org-list";

export default function OrganizationsPage() {
  const { data: session } = useSession();
  const { data, isLoading, error } = trpc.organization.listPublic.useQuery();

  const userBelongsToOrgIds = new Set<string>();
  const hasOrganization = Boolean(session?.user?.organizationId);
  if (session?.user?.organizationId) {
    userBelongsToOrgIds.add(session.user.organizationId);
  }

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="text-2xl font-bold">Organizations</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        {hasOrganization
          ? "Browse organizations."
          : "Create an organization or request to join one."}
      </p>

      <div className="mt-8 space-y-8">
        {!hasOrganization ? (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Create organization</h2>
            <CreateOrganizationForm />
          </section>
        ) : null}

        <section>
          <h2 className="mb-4 text-lg font-semibold">Discover organizations</h2>
          {isLoading ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Loading...
            </p>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load organizations.
            </p>
          ) : (
            <OrgList
              items={data?.items ?? []}
              userBelongsToOrgIds={userBelongsToOrgIds}
              canRequestJoin={!hasOrganization}
            />
          )}
        </section>
      </div>
    </div>
  );
}
