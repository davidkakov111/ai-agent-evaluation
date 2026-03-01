import type { OrgRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      organizationId: string | null;
      role: OrgRole | null;
    };
  }

  interface User {
    id: string;
    organizationId: string | null;
    role: OrgRole | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    organizationId?: string | null;
    role?: OrgRole | null;
  }
}
