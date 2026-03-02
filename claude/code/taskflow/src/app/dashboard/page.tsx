import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { DashboardWithOrg } from "./dashboard-with-org";
import { DashboardNoOrg } from "./dashboard-no-org";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.organizationId) {
    return <DashboardWithOrg />;
  }

  return <DashboardNoOrg />;
}
