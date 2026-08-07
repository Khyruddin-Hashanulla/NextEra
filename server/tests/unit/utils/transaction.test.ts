import mongoose from 'mongoose';
import { withTransaction, resetTransactionsSupportCache } from '../../../src/utils/transaction';

function createSessionMock() {
  return {
    startTransaction: vi.fn(),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    abortTransaction: vi.fn().mockResolvedValue(undefined),
    endSession: vi.fn(),
  } as unknown as mongoose.ClientSession;
}

function mockConnectionDb(hello: Record<string, unknown>) {
  const db = { command: vi.fn().mockResolvedValue(hello) };
  Object.defineProperty(mongoose.connection, 'db', {
    value: db,
    configurable: true,
  });
  return db;
}

function mockNoConnection() {
  delete (mongoose.connection as { db?: unknown }).db;
}

describe('withTransaction', () => {
  beforeEach(() => {
    resetTransactionsSupportCache();
    mockConnectionDb({ setName: 'rs0' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockNoConnection();
  });

  it('commits the transaction and returns the result', async () => {
    const session = createSessionMock();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session);

    const result = await withTransaction(async (s) => {
      expect(s).toBe(session);
      return 'done';
    });

    expect(result).toBe('done');
    expect(session.startTransaction).toHaveBeenCalledOnce();
    expect(session.commitTransaction).toHaveBeenCalledOnce();
    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledOnce();
  });

  it('aborts and rethrows when the operation fails', async () => {
    const session = createSessionMock();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session);

    const boom = new Error('boom');
    await expect(
      withTransaction(async () => {
        throw boom;
      }),
    ).rejects.toThrow('boom');

    expect(session.abortTransaction).toHaveBeenCalledOnce();
    expect(session.commitTransaction).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledOnce();
  });

  it('still ends the session when commit throws', async () => {
    const session = createSessionMock();
    session.commitTransaction = vi.fn().mockRejectedValue(new Error('commit failed'));
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session);

    await expect(withTransaction(async () => 'ok')).rejects.toThrow('commit failed');
    expect(session.endSession).toHaveBeenCalledOnce();
  });

  it('still ends the session and rethrows the original error when abort throws', async () => {
    const session = createSessionMock();
    session.abortTransaction = vi.fn().mockRejectedValue(new Error('abort failed'));
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session);

    await expect(
      withTransaction(async () => {
        throw new Error('work failed');
      }),
    ).rejects.toThrow('work failed');
    expect(session.endSession).toHaveBeenCalledOnce();
  });
});

describe('withTransaction on a server without transaction support', () => {
  beforeEach(() => {
    resetTransactionsSupportCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockNoConnection();
  });

  it('runs the operation without a transaction on a standalone mongod', async () => {
    mockConnectionDb({ isWritablePrimary: true });
    const session = createSessionMock();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session);

    const result = await withTransaction(async (s) => {
      expect(s).toBe(session);
      return 'done';
    });

    expect(result).toBe('done');
    expect(session.startTransaction).not.toHaveBeenCalled();
    expect(session.commitTransaction).not.toHaveBeenCalled();
    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledOnce();
  });

  it('falls back to a non-transactional run when transaction support cannot be detected', async () => {
    const db = mockConnectionDb({});
    db.command.mockRejectedValueOnce(new Error('connection reset'));
    const session = createSessionMock();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session);

    const result = await withTransaction(async (s) => {
      expect(s).toBe(session);
      return 'done';
    });

    expect(result).toBe('done');
    expect(session.startTransaction).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledOnce();
  });

  it('falls back to a non-transactional run when no connection is available', async () => {
    mockNoConnection();
    const session = createSessionMock();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session);

    const result = await withTransaction(async (s) => {
      expect(s).toBe(session);
      return 'done';
    });

    expect(result).toBe('done');
    expect(session.startTransaction).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledOnce();
  });

  it('still rethrows operation errors in fallback mode', async () => {
    mockConnectionDb({ isWritablePrimary: true });
    const session = createSessionMock();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session);

    await expect(
      withTransaction(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledOnce();
  });
});
