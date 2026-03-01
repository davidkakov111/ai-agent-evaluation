import { PendingJoinRequestsPanel } from "@/features/join-requests/components/pending-join-requests-panel";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { CreateTaskForm } from "@/features/tasks/components/create-task-form";
import { TaskListPanel } from "@/features/tasks/components/task-list-panel";
import { requireMembershipSessionStrict } from "@/server/auth";
import { logger } from "@/server/logging/logger";
import { createServerCaller } from "@/server/trpc/server-caller";

export default async function DashboardPage() {
  const session = await requireMembershipSessionStrict();
  const caller = await createServerCaller();
  let taskPage: Awaited<ReturnType<typeof caller.task.list>> | null = null;
  let memberPage: Awaited<ReturnType<typeof caller.organization.members>> | null = null;
  let pendingPage: Awaited<ReturnType<typeof caller.joinRequest.listPending>> | { items: [] } = {
    items: [],
  };
  let loadError: string | null = null;
  const isOwnerOrAdmin = session.user.role === "OWNER" || session.user.role === "ADMIN";

  try {
    if (isOwnerOrAdmin) {
      [taskPage, memberPage, pendingPage] = await Promise.all([
        caller.task.list({
          page: 1,
          pageSize: 100,
          sortBy: "updatedAt",
          sortOrder: "desc",
        }),
        caller.organization.members({
          page: 1,
          pageSize: 100,
          sortOrder: "asc",
        }),
        caller.joinRequest.listPending({
          page: 1,
          pageSize: 50,
          sortOrder: "asc",
        }),
      ]);
    } else {
      taskPage = await caller.task.list({
        page: 1,
        pageSize: 100,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });
      pendingPage = { items: [] };
    }
  } catch (error: unknown) {
    logger.error("Dashboard page load failed.", {
      scope: "dashboard.page",
      error,
      meta: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
      },
    });
    loadError =
      "Data could not be loaded. Refresh the page. If this continues, sign out and sign in again.";
  }

  const employees =
    memberPage?.items
      .filter((member) => member.role === "EMPLOYEE")
      .map((member) => ({
        userId: member.userId,
        label: `${member.user.name} (${member.user.email})`,
      })) ?? [];
  const taskItems = taskPage?.items ?? [];

  return (
    <main className="app-shell space-y-4">
      <header className="surface flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h1 className="text-2xl font-extrabold">TaskFlow Dashboard</h1>
          <p className="text-sm text-[var(--ink-soft)]">
            Organization role: <span className="font-semibold">{session.user.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--ink-soft)]">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>

      {loadError !== null ? (
        <section className="surface p-6">
          <h2 className="text-xl font-bold">Unable to load dashboard</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{loadError}</p>
        </section>
      ) : (
        <>
          {isOwnerOrAdmin ? <CreateTaskForm employees={employees} /> : null}
          {isOwnerOrAdmin ? <PendingJoinRequestsPanel items={pendingPage.items} /> : null}
          <TaskListPanel role={session.user.role} tasks={taskItems} employees={employees} />
        </>
      )}
    </main>
  );
}
