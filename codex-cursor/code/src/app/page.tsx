import { redirect } from "next/navigation";

import { getAuthSession } from "@/server/auth/session";

export default async function HomePage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.organizationId) {
    redirect("/dashboard");
  }

  redirect("/onboarding");
}
