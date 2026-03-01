import type { DefaultSession } from "next-auth";

type AppRole = "OWNER" | "ADMIN" | "EMPLOYEE";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string | null;
      role: AppRole | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    organizationId?: string | null;
    role?: AppRole | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}
