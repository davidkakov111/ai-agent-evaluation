"use client";

import { RequestJoinButton } from "./request-join-button";

interface OrgItem {
  id: string;
  name: string;
  slug: string;
}

interface OrgListProps {
  items: OrgItem[];
  userBelongsToOrgIds: Set<string>;
  canRequestJoin: boolean;
}

export function OrgList({
  items,
  userBelongsToOrgIds,
  canRequestJoin,
}: OrgListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No organizations found. Create one to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {items.map((org) => {
        const isMember = userBelongsToOrgIds.has(org.id);

        return (
          <li
            key={org.id}
            className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
          >
            <div>
              <p className="font-medium">{org.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {org.slug}
              </p>
            </div>
            {isMember ? (
              <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium dark:bg-zinc-700">
                Member
              </span>
            ) : canRequestJoin ? (
              <RequestJoinButton organizationId={org.id} />
            ) : (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Already in an organization
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
