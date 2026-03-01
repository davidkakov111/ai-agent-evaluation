import type { TaskStatus } from "@prisma/client";

import type { DbClient } from "@/server/repositories/types";

const taskSelect = {
  id: true,
  organizationId: true,
  createdById: true,
  assignedToId: true,
  assignedById: true,
  assignedAt: true,
  statusUpdatedById: true,
  statusUpdatedAt: true,
  title: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const taskRepository = {
  findById(db: DbClient, id: string) {
    return db.task.findUnique({
      where: { id },
      select: taskSelect,
    });
  },

  findByIdInOrganization(db: DbClient, id: string, organizationId: string) {
    return db.task.findFirst({
      where: {
        id,
        organizationId,
      },
      select: taskSelect,
    });
  },

  create(
    db: DbClient,
    input: {
      organizationId: string;
      createdById: string;
      assignedToId: string;
      assignedById: string;
      title: string;
      description: string;
      status?: TaskStatus;
    },
  ) {
    return db.task.create({
      data: {
        organizationId: input.organizationId,
        createdById: input.createdById,
        assignedToId: input.assignedToId,
        assignedById: input.assignedById,
        assignedAt: new Date(),
        title: input.title,
        description: input.description,
        ...(input.status ? { status: input.status } : {}),
      },
      select: taskSelect,
    });
  },

  listByOrganization(db: DbClient, organizationId: string) {
    return db.task.findMany({
      where: { organizationId },
      select: taskSelect,
      orderBy: { createdAt: "desc" },
    });
  },

  listAssignedToUser(db: DbClient, organizationId: string, userId: string) {
    return db.task.findMany({
      where: {
        organizationId,
        assignedToId: userId,
      },
      select: taskSelect,
      orderBy: { createdAt: "desc" },
    });
  },

  updateStatus(
    db: DbClient,
    input: { id: string; status: TaskStatus; statusUpdatedById: string },
  ) {
    return db.task.update({
      where: { id: input.id },
      data: {
        status: input.status,
        statusUpdatedById: input.statusUpdatedById,
        statusUpdatedAt: new Date(),
      },
      select: taskSelect,
    });
  },

  updateAssignee(
    db: DbClient,
    input: { id: string; assignedToId: string; assignedById: string },
  ) {
    return db.task.update({
      where: { id: input.id },
      data: {
        assignedToId: input.assignedToId,
        assignedById: input.assignedById,
        assignedAt: new Date(),
      },
      select: taskSelect,
    });
  },
};
