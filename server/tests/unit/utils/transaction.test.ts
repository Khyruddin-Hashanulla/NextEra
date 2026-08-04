import mongoose from 'mongoose';
import { withTransaction } from '../../../src/utils/transaction';

function createSessionMock() {
  return {
    startTransaction: vi.fn(),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    abortTransaction: vi.fn().mockResolvedValue(undefined),
    endSession: vi.fn(),
  } as unknown as mongoose.ClientSession;
}

describe('withTransaction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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

  it('still ends the session when abort throws', async () => {
    const session = createSessionMock();
    session.abortTransaction = vi.fn().mockRejectedValue(new Error('abort failed'));
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(session);

    await expect(
      withTransaction(async () => {
        throw new Error('work failed');
      }),
    ).rejects.toThrow('abort failed');
    expect(session.endSession).toHaveBeenCalledOnce();
  });
});
