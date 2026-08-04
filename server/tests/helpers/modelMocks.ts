export interface QueryChain {
  populate: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  sort: ReturnType<typeof vi.fn>;
  skip: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  session: ReturnType<typeof vi.fn>;
  lean: ReturnType<typeof vi.fn>;
  exec: ReturnType<typeof vi.fn>;
}

export function chainTo(value: unknown): QueryChain {
  const chain = {
    populate: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    session: vi.fn().mockReturnThis(),
    lean: vi.fn().mockReturnValue(value),
    exec: vi.fn().mockResolvedValue(value),
  };
  return chain;
}

export interface FakeClientSession {
  startTransaction: ReturnType<typeof vi.fn>;
  commitTransaction: ReturnType<typeof vi.fn>;
  abortTransaction: ReturnType<typeof vi.fn>;
  endSession: ReturnType<typeof vi.fn>;
}

export function createFakeSession(): FakeClientSession {
  return {
    startTransaction: vi.fn(),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    abortTransaction: vi.fn().mockResolvedValue(undefined),
    endSession: vi.fn(),
  };
}
