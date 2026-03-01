"use client";

import { OrgRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { trpc } from "@/lib/trpc/react";

export function OnboardingPanel() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const createOrganization = trpc.organization.create.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      router.push("/dashboard");
      router.refresh();
    },
  });

  const createJoinRequest = trpc.joinRequest.create.useMutation({
    onSuccess: async () => {
      await utils.joinRequest.list.invalidate();
    },
  });

  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [organizationIdToJoin, setOrganizationIdToJoin] = useState("");

  const [orgError, setOrgError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  async function onCreateOrganization(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOrgError(null);

    try {
      await createOrganization.mutateAsync({ name: orgName, slug: orgSlug });
    } catch {
      setOrgError("Could not create organization. Try a different slug.");
    }
  }

  async function onRequestToJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJoinError(null);
    setJoinSuccess(null);

    try {
      await createJoinRequest.mutateAsync({
        organizationId: organizationIdToJoin,
        requestedRole: OrgRole.EMPLOYEE,
      });
      setJoinSuccess("Join request submitted. Please wait for approval.");
      setOrganizationIdToJoin("");
    } catch {
      setJoinError("Could not submit join request. Verify organization ID.");
    }
  }

  return (
    <section className="grid-2 gap-md">
      <form className="panel stack-sm" onSubmit={onCreateOrganization}>
        <h2>Create an organization</h2>
        <p className="muted">You will become the OWNER automatically.</p>
        <label className="stack-xs">
          <span>Organization name</span>
          <input
            className="input"
            value={orgName}
            onChange={(event) => setOrgName(event.target.value)}
            required
          />
        </label>
        <label className="stack-xs">
          <span>Slug</span>
          <input
            className="input"
            value={orgSlug}
            onChange={(event) => setOrgSlug(event.target.value)}
            required
            pattern="^[a-z0-9-]+$"
          />
        </label>
        {orgError ? <p className="banner error">{orgError}</p> : null}
        <button type="submit" className="button" disabled={createOrganization.isPending}>
          {createOrganization.isPending ? "Creating..." : "Create organization"}
        </button>
      </form>

      <form className="panel stack-sm" onSubmit={onRequestToJoin}>
        <h2>Request to join</h2>
        <p className="muted">
          Ask an owner/admin for the organization ID and submit a request.
        </p>
        <label className="stack-xs">
          <span>Organization ID</span>
          <input
            className="input"
            value={organizationIdToJoin}
            onChange={(event) => setOrganizationIdToJoin(event.target.value)}
            required
          />
        </label>
        {joinError ? <p className="banner error">{joinError}</p> : null}
        {joinSuccess ? <p className="banner success">{joinSuccess}</p> : null}
        <button type="submit" className="button secondary" disabled={createJoinRequest.isPending}>
          {createJoinRequest.isPending ? "Submitting..." : "Request to join"}
        </button>
      </form>
    </section>
  );
}
