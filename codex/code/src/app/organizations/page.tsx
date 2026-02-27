import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { CreateOrganizationForm } from "@/features/organizations/components/create-organization-form";
import { RequestJoinButton } from "@/features/organizations/components/request-join-button";
import { requireAuthenticatedSession } from "@/server/auth";
import { logger } from "@/server/logging/logger";
import { createServerCaller } from "@/server/trpc/server-caller";

export default async function OrganizationsPage() {
  const session = await requireAuthenticatedSession();

  if (session.user.organizationId !== null && session.user.role !== null) {
    redirect("/dashboard");
  }

  const caller = await createServerCaller();
  let organizations:
    | Awaited<ReturnType<typeof caller.organization.listPublic>>
    | null = null;
  let loadError: string | null = null;

  try {
    organizations = await caller.organization.listPublic({
      page: 1,
      pageSize: 50,
      sortBy: "name",
      sortOrder: "asc",
    });
  } catch (error: unknown) {
    logger.error("Organizations page load failed.", {
      scope: "organizations.page",
      error,
      meta: {
        userId: session.user.id,
      },
    });
    loadError = "Please refresh and try again. If the issue persists, sign out and sign in again.";
  }

  return (
    <main className="app-shell space-y-4">
      <header className="surface flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h1 className="text-2xl font-extrabold">Organizations</h1>
          <p className="text-sm text-[var(--ink-soft)]">
            Create your own organization or request to join an existing one.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--ink-soft)]">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <CreateOrganizationForm />

      {loadError !== null ? (
        <section className="surface p-6">
          <h2 className="text-xl font-bold">Unable to load organizations</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{loadError}</p>
        </section>
      ) : organizations === null || organizations.items.length === 0 ? (
        <section className="surface p-6">
          <p className="text-sm text-[var(--ink-soft)]">No organizations are currently available.</p>
        </section>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.items.map((organization) => (
            <article key={organization.id} className="surface stack p-5">
              <h2 className="text-lg font-bold">{organization.name}</h2>
              <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
                {organization.slug}
              </p>
              <RequestJoinButton organizationId={organization.id} />
            </article>
          ))}
        </section>
      )}

      <p className="text-xs text-[var(--ink-soft)]">
        Need access to a private org? Ask an owner/admin for approval after requesting.
        <br />
        <Link className="font-semibold text-[var(--brand-deep)]" href="/login">
          Back to login
        </Link>
      </p>
    </main>
  );
}
