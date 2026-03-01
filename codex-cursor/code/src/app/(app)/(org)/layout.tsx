import { redirect } from "next/navigation";

import { getAuthSession } from "@/server/auth/session";

export default async function OrganizationLayout(props: { children: React.ReactNode }) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!session.user.organizationId) {
    redirect("/onboarding");
  }

  return props.children;
}
