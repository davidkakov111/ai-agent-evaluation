import { JoinRequestsPanel } from "@/features/join-requests/JoinRequestsPanel";
import { getAuthSession } from "@/server/auth/session";

export default async function JoinRequestsPage() {
  const session = await getAuthSession();
  const canManage = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  return (
    <section className="stack-md">
      <h2>Join requests</h2>
      <JoinRequestsPanel canManage={canManage} />
    </section>
  );
}
