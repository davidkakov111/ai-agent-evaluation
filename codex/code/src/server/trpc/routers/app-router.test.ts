import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "@/server/trpc/routers/_app";
import type { TRPCContext } from "@/server/trpc/context";

const makeSessionUser = (role: "OWNER" | "ADMIN" | "EMPLOYEE" | null, organizationId: string | null) => ({
  id: "user-1",
  email: "user@taskflow.local",
  name: "User",
  role,
  organizationId,
});

describe("AppRouter permission and validation boundaries", () => {
  const services = {
    auth: {
      register: vi.fn(),
      authenticateWithPassword: vi.fn(),
      getSessionMembership: vi.fn(),
    },
    organization: {
      listDiscoverableOrganizations: vi.fn(),
      listPublicOrganizations: vi.fn(),
      createOrganization: vi.fn(),
      requestToJoinOrganization: vi.fn(),
      listPendingJoinRequests: vi.fn(),
      approveJoinRequest: vi.fn(),
      rejectJoinRequest: vi.fn(),
      listOrganizationMembers: vi.fn(),
    },
    system: {
      healthcheck: vi.fn(),
    },
    task: {
      createTask: vi.fn(),
      reassignTask: vi.fn(),
      listTasks: vi.fn(),
      updateTaskStatus: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createCaller = (session: TRPCContext["session"]) => {
    const ctx: TRPCContext = {
      headers: new Headers(),
      session,
      services: services as unknown as TRPCContext["services"],
    };

    return appRouter.createCaller(ctx);
  };

  it("rejects protected procedure when unauthenticated", async () => {
    const caller = createCaller(null);

    await expect(
      caller.organization.create({ name: "Acme", slug: "acme" }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects owner/admin route for employee role", async () => {
    const caller = createCaller({
      user: makeSessionUser("EMPLOYEE", "org-a"),
    });

    await expect(caller.joinRequest.listPending()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    await expect(caller.organization.members()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects member route when user has no membership", async () => {
    const caller = createCaller({
      user: makeSessionUser(null, null),
    });

    await expect(caller.task.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("returns BAD_REQUEST for auth input validation failures", async () => {
    const caller = createCaller(null);

    await expect(
      caller.auth.register({ name: "", email: "invalid-email", password: "weak" }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(services.auth.register).not.toHaveBeenCalled();
  });

  it("returns BAD_REQUEST for task input validation failures", async () => {
    const caller = createCaller({
      user: makeSessionUser("OWNER", "org-a"),
    });

    await expect(
      caller.task.create({
        title: "",
        description: null,
        assignedToUserId: "",
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(services.task.createTask).not.toHaveBeenCalled();
  });
});
