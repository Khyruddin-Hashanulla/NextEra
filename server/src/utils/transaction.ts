import mongoose from 'mongoose';
import { logger } from './logger';

let cachedTransactionsSupported: boolean | null = null;
let fallbackWarned = false;

async function detectTransactionsSupported(): Promise<boolean> {
  if (cachedTransactionsSupported !== null) {
    return cachedTransactionsSupported;
  }

  const db = mongoose.connection.db;
  if (!db) {
    return false;
  }

  try {
    const hello: { setName?: string; msg?: string } = await db.command({ hello: 1 });
    cachedTransactionsSupported = Boolean(hello.setName) || hello.msg === 'isdbgrid';
  } catch (error) {
    logger.warn('Could not detect MongoDB transaction support:', error);
  }

  return cachedTransactionsSupported ?? false;
}

/** @internal Test helper: clears cached transaction-support detection state. */
export function resetTransactionsSupportCache(): void {
  cachedTransactionsSupported = null;
  fallbackWarned = false;
}

export async function withTransaction<T>(fn: (session: mongoose.ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  let transactionActive = false;

  try {
    if (await detectTransactionsSupported()) {
      session.startTransaction();
      transactionActive = true;
    } else if (!fallbackWarned) {
      fallbackWarned = true;
      logger.warn(
        'MongoDB transactions are unavailable on this server (they require a replica set, e.g. MongoDB Atlas). ' +
          'Running multi-document database operations without atomic transactions.'
      );
    }

    const result = await fn(session);

    if (transactionActive) {
      await session.commitTransaction();
    }

    return result;
  } catch (error) {
    if (transactionActive) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        logger.error('Failed to abort MongoDB transaction:', abortError);
      }
    }
    throw error;
  } finally {
    session.endSession();
  }
}
