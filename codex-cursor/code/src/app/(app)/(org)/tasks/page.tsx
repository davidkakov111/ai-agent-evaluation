import { TaskWorkspace } from "@/features/tasks/TaskWorkspace";

export default async function TasksPage() {
  return (
    <section className="stack-md">
      <h2>Tasks</h2>
      <TaskWorkspace />
    </section>
  );
}
