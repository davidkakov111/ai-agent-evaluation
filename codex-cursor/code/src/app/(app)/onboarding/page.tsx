import { redirect } from "next/navigation";

import { OnboardingPanel } from "@/features/organization/OnboardingPanel";
import { getAuthSession } from "@/server/auth/session";

export default async function OnboardingPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.organizationId) {
    redirect("/dashboard");
  }

  return (
    <section className="stack-md">
      <h2>Organization onboarding</h2>
      <p className="muted">
        Create your own organization or request to join an existing one.
      </p>
      <OnboardingPanel />
    </section>
  );
}
