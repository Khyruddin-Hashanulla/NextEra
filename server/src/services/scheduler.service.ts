import { paymentService } from './payment.service';
import { Refund } from '../models/refund.model';
import { InstructorSubscription } from '../models/instructorSubscription.model';
import { InstructorSubscriptionPlan } from '../models/instructorSubscriptionPlan.model';
import { Notification } from '../models/notification.model';
import { cacheManager } from '../cache/cacheManager';
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

export async function expireInstructorSubscriptions(): Promise<void> {
  try {
    const now = new Date();
    const expired = await InstructorSubscription.find({
      status: { $in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      endDate: { $lte: now },
    });

    if (expired.length === 0) return;

    const ids = expired.map((s) => s._id);
    await InstructorSubscription.updateMany(
      { _id: { $in: ids }, status: { $in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
      { $set: { status: 'EXPIRED' } }
    );

    // Only ACTIVE subscriptions were counted on the admin plan card. TRIALING /
    // PAST_DUE records were never incremented, so they must not be decremented.
    const activeExpired = expired.filter((s) => s.status === 'ACTIVE');
    const decrementByPlan = new Map<string, number>();
    for (const sub of activeExpired) {
      const planId = sub.plan?.toString();
      if (!planId) continue;
      decrementByPlan.set(planId, (decrementByPlan.get(planId) || 0) + 1);
    }
    await Promise.allSettled(
      [...decrementByPlan.entries()].map(([planId, amount]) =>
        InstructorSubscriptionPlan.updateOne({ _id: planId }, { $inc: { totalSubscribers: -amount } }).catch((err) =>
          logger.warn('totalSubscribers decrement failed on expiry', { planId, error: err })
        )
      )
    );

    await Notification.insertMany(
      expired.map((s) => ({
        user: s.instructor,
        type: 'system',
        title: 'Instructor plan expired',
        message: 'Your instructor plan has expired. Renew now to keep creating courses and selling content.',
        link: '/instructor/subscription',
      }))
    );

    const instructors = [...new Set(expired.map((s) => s.instructor.toString()))];
    await Promise.allSettled(instructors.map((id) => cacheManager.invalidateInstructorCache(id)));

    logger.info(`[Cron] Expired ${expired.length} instructor subscriptions`);
  } catch (error) {
    logger.error('[Cron] Instructor subscription expiry failed:', error);
  }
}

export async function runAllScheduledTasks(): Promise<void> {
  await processScheduledPayouts();
  await autoApprovePendingRefunds();
  await expireInstructorSubscriptions();
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
