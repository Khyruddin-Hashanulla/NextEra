import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { logger } from '../src/utils/logger';
import { Refund } from '../src/models/refund.model';

const ACTIVE_REFUND_STATUSES = ['pending', 'approved', 'processed'];

/**
 * Deliberate, one-time DB migrations that must run BEFORE relying on the schema
 * indexes alone (mongoose builds schema indexes on app boot, but production data
 * may already contain rows that violate a new constraint).
 *
 * Current migration:
 *  - Dedupe active refunds: the pre-race-guard in PaymentService.processRefundPayment
 *    (`Refund.findOne({ payment, status: { $in: [...] } })`) was not backed by a DB
 *    constraint, so two concurrent admin refunds of the same payment could both pass
 *    the check. Any such duplicates are collapsed here (newest kept, older ones
 *    marked `rejected` with an adminNote) so the unique partial index can build.
 *  - Create the unique partial index { payment: 1 } filtered to
 *    status in {pending, approved, processed} on the Refund collection.
 *
 * Idempotent: groups with no duplicates are skipped; createIndex with the same
 * key/options simply reports the existing index.
 */
async function main() {
  await mongoose.connect(env.mongodbUri);

  logger.info('[db:migrate] Starting applyDbMigrations...');

  // ── 1. Dedupe active refunds ─────────────────────────────────────────
  const groups = await Refund.aggregate<{ _id: mongoose.Types.ObjectId; ids: mongoose.Types.ObjectId[] }>([
    { $match: { status: { $in: ACTIVE_REFUND_STATUSES } } },
    { $sort: { createdAt: -1, _id: -1 } },
    { $group: { _id: '$payment', ids: { $push: '$_id' } } },
    { $match: { 'ids.1': { $exists: true } } },
  ]);

  let deduped = 0;
  for (const group of groups) {
    const [keepId, ...duplicateIds] = group.ids;
    for (const duplicateId of duplicateIds) {
      await Refund.findByIdAndUpdate(duplicateId, {
        $set: {
          status: 'rejected',
          adminNote: `Auto-deduped by applyDbMigrations; superseded by refund ${keepId.toString()}. The active-refund unique index requires at most one active refund per payment.`,
        },
      });
      deduped += 1;
      logger.warn(`[db:migrate] Rejected duplicate refund ${duplicateId} for payment ${group._id}; kept ${keepId}`);
    }
  }
  logger.info(`[db:migrate] Deduped ${deduped} duplicate refund(s)`);

  // ── 2. Create the active-refund unique partial index ─────────────────
  const indexName = 'unique_active_refund_per_payment';
  await Refund.collection.createIndex(
    { payment: 1 },
    {
      name: indexName,
      unique: true,
      partialFilterExpression: { status: { $in: ACTIVE_REFUND_STATUSES } },
    }
  );
  logger.info(`[db:migrate] Index '${indexName}' ensured on refunds`);

  logger.info('[db:migrate] Done');
  await mongoose.disconnect();
}

main().catch(async (error) => {
  logger.error('[db:migrate] Failed', error);
  await mongoose.disconnect();
  process.exit(1);
});
