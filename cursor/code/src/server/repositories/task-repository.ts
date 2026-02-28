import type { Prisma, PrismaClient, TaskStatus } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;
type TaskSortField = "createdAt" | "updatedAt" | "status";
type SortOrder = "asc" | "desc";

interface CreateTaskRecordInput {
  organizationId: string;
  title: string;
  description: string | null;
  assignedToId: string;
  createdById: string;
}

interface UpdateTaskStatusAtomicInput {
  taskId: string;
  organizationId: string;
  currentStatus: TaskStatus;
  nextStatus: TaskStatus;
}

interface ReassignTaskInput {
  taskId: string;
  organizationId: string;
  assignedToId: string;
}

interface ListTasksOptions {
  skip: number;
  take: number;
  sortBy: TaskSortField;
  sortOrder: SortOrder;
}

export class TaskRepository {
  public constructor(private readonly db: PrismaClient) {}

  private getClient(tx?: Prisma.TransactionClient): DbClient {
    return tx ?? this.db;
  }

  public findMembershipByUserAndOrganization(
    userId: string,
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).membership.findFirst({
      where: {
        userId,
        organizationId,
      },
      select: {
        userId: true,
        organizationId: true,
        role: true,
      },
    });
  }

  public createTask(
    input: CreateTaskRecordInput,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).task.create({
      data: {
        organizationId: input.organizationId,
        title: input.title,
        description: input.description,
        assignedToId: input.assignedToId,
        createdById: input.createdById,
      },
      select: {
        id: true,
        organizationId: true,
        title: true,
        description: true,
        assignedToId: true,
        createdById: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  public findTaskByIdInOrganization(
    taskId: string,
    organizationId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.getClient(tx).task.findFirst({
      where: {
        id: taskId,
        organizationId,
      },
      select: {
        id: true,
        organizationId: true,
        title: true,
        description: true,
        assignedToId: true,
        createdById: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  public listTasksForOrganization(
    organizationId: string,
    status: TaskStatus | undefined,
    options: ListTasksOptions,
  ) {
    return this.db.task.findMany({
      where: {
        organizationId,
        ...(status !== undefined ? { status } : {}),
      },
      orderBy: [{ [options.sortBy]: options.sortOrder }, { id: "desc" }],
      skip: options.skip,
      take: options.take,
      select: {
        id: true,
        organizationId: true,
        title: true,
        description: true,
        assignedToId: true,
        createdById: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  public listTasksForAssignee(
    organizationId: string,
    assignedToId: string,
    status: TaskStatus | undefined,
    options: ListTasksOptions,
  ) {
    return this.db.task.findMany({
      where: {
        organizationId,
        assignedToId,
        ...(status !== undefined ? { status } : {}),
      },
      orderBy: [{ [options.sortBy]: options.sortOrder }, { id: "desc" }],
      skip: options.skip,
      take: options.take,
      select: {
        id: true,
        organizationId: true,
        title: true,
        description: true,
        assignedToId: true,
        createdById: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  public updateTaskStatusAtomic(
    input: UpdateTaskStatusAtomicInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    return this.getClient(tx)
      .task.updateMany({
        where: {
          id: input.taskId,
          organizationId: input.organizationId,
          status: input.currentStatus,
        },
        data: {
          status: input.nextStatus,
        },
      })
      .then((result) => result.count);
  }

  public reassignTask(
    input: ReassignTaskInput,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    return this.getClient(tx)
      .task.updateMany({
        where: {
          id: input.taskId,
          organizationId: input.organizationId,
        },
        data: {
          assignedToId: input.assignedToId,
        },
      })
      .then((result) => result.count);
  }
}
