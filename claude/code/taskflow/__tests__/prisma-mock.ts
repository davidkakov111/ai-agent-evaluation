import { vi } from "vitest";

function createMockModel() {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  };
}

export function createMockPrisma() {
  const mock = {
    user: createMockModel(),
    organization: createMockModel(),
    task: createMockModel(),
    joinRequest: createMockModel(),
    $transaction: vi.fn(),
  };

  mock.$transaction.mockImplementation(async (fn: (tx: typeof mock) => Promise<unknown>) => {
    return fn(mock);
  });

  return mock;
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
