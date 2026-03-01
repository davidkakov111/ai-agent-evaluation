import { JoinRequestsPanel } from "@/features/join-requests/JoinRequestsPanel";
import { TaskWorkspace } from "@/features/tasks/TaskWorkspace";
import { getAuthSession } from "@/server/auth/session";

export default async function DashboardPage() {
  const session = await getAuthSession();
  const canManage = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  return (
    <section className="stack-md">
      <h2>Dashboard</h2>
      <p className="muted">
        Role: <strong>{session?.user?.role ?? "UNKNOWN"}</strong>
      </p>
      <TaskWorkspace canManage={canManage} />
      <JoinRequestsPanel canManage={canManage} />
    </section>
  );
}
