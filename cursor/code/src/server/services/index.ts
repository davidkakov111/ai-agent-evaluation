import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";
import { AuthRepository } from "@/server/repositories/auth-repository";
import { OrganizationRepository } from "@/server/repositories/organization-repository";
import { TaskRepository } from "@/server/repositories/task-repository";
import { SystemRepository } from "@/server/repositories/system-repository";
import { AuthService } from "./auth-service";
import { OrganizationService } from "./organization-service";
import { SystemService } from "./system-service";
import { TaskService } from "./task-service";

export interface ServiceContainer {
  auth: AuthService;
  organization: OrganizationService;
  system: SystemService;
  task: TaskService;
}

export function createServices(db: PrismaClient = prisma): ServiceContainer {
  const authRepository = new AuthRepository(db);
  const organizationRepository = new OrganizationRepository(db);
  const taskRepository = new TaskRepository(db);
  const systemRepository = new SystemRepository(db);

  return {
    auth: new AuthService(authRepository),
    organization: new OrganizationService(db, organizationRepository),
    system: new SystemService(systemRepository),
    task: new TaskService(taskRepository),
  };
}
