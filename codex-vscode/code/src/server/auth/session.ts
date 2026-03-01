import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import type { AppSession } from "./types";

export async function getAuthSession(): Promise<AppSession | null> {
  const session = await getServerSession(authOptions);

  if (session?.user === undefined) {
    return null;
  }

  const { user } = session;

  if (user.email === null || user.email === undefined) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      organizationId: user.organizationId,
      role: user.role,
    },
  };
}
