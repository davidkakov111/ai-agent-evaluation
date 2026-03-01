import { TaskWorkspace } from "@/features/tasks/TaskWorkspace";
import { getAuthSession } from "@/server/auth/session";

export default async function TasksPage() {
  const session = await getAuthSession();
  const canManage = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  return (
    <section className="stack-md">
      <h2>Tasks</h2>
      <TaskWorkspace canManage={canManage} />
    </section>
  );
}
