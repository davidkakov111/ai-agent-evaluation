import { redirect } from "next/navigation";
import { getAuthSession } from "@/server/auth";

export default async function HomePage() {
  const session = await getAuthSession();

  if (session === null) {
    redirect("/login");
  }

  if (session.user.organizationId === null || session.user.role === null) {
    redirect("/organizations");
  }

  redirect("/dashboard");
}
