import { paymentService } from './payment.service';
import { Refund } from '../models/refund.model';
import { logger } from '../utils/logger';

const PAYOUT_INTERVAL_MS = 24 * 60 * 60 * 1000;
const REFUND_AUTO_APPROVE_DAYS = 7;

let payoutTimer: NodeJS.Timeout | null = null;

export async function processScheduledPayouts(): Promise<void> {
  try {
    logger.info('[Cron] Starting scheduled payout processing...');
    const result = await paymentService.processAllPendingPayouts();
    logger.info(`[Cron] Payout processing complete: ${result.success} processed, ${result.failed} failed`);
  } catch (error) {
    logger.error('[Cron] Payout processing failed:', error);
  }
}

export async function autoApprovePendingRefunds(): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - REFUND_AUTO_APPROVE_DAYS);

    const pendingRefunds = await Refund.find({
      status: 'pending',
      createdAt: { $lte: cutoffDate },
    });

    for (const refund of pendingRefunds) {
      try {
        refund.status = 'approved';
        await refund.save();
        logger.info(`[Cron] Auto-approved refund ${refund._id}`);
      } catch (err) {
        logger.error(`[Cron] Failed to auto-approve refund ${refund._id}:`, err);
      }
    }

    if (pendingRefunds.length > 0) {
      logger.info(`[Cron] Auto-approved ${pendingRefunds.length} pending refunds`);
    }
  } catch (error) {
    logger.error('[Cron] Refund auto-approval failed:', error);
  }
}

export async function runAllScheduledTasks(): Promise<void> {
  await processScheduledPayouts();
  await autoApprovePendingRefunds();
}

export function startScheduler(): void {
  if (payoutTimer) return;

  logger.info(`[Cron] Starting scheduler with ${PAYOUT_INTERVAL_MS / 60000} minute interval`);

  runAllScheduledTasks();

  payoutTimer = setInterval(runAllScheduledTasks, PAYOUT_INTERVAL_MS);
}

export function stopScheduler(): void {
  if (payoutTimer) {
    clearInterval(payoutTimer);
    payoutTimer = null;
    logger.info('[Cron] Scheduler stopped');
  }
}
