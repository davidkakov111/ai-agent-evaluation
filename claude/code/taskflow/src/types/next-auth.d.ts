import type { MemberRole } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    role?: MemberRole | null;
    organizationId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: MemberRole | null;
      organizationId: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
