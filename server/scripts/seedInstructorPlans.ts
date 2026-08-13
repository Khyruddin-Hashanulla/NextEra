import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { logger } from '../src/utils/logger';
import { InstructorSubscriptionPlan } from '../src/models/instructorSubscriptionPlan.model';
import { InstructorSubscription } from '../src/models/instructorSubscription.model';
import { User } from '../src/models/user.model';
import { ROLES } from '../src/constants/roles';
import { DEFAULT_INSTRUCTOR_PLANS, CANONICAL_PLAN_CODES } from '../src/data/defaultInstructorPlans';

/**
 * Opt-in plan seeding/backfill.
 *
 *   npm run seed:instructor-plans
 *
 * Idempotent:
 *  - Plans are keyed by their immutable `code` (unique sparse index). Existing
 *    plans are never overwritten; absent fields are filled from the defaults.
 *  - Afterwards, every instructor WITHOUT an ACTIVE subscription is granted the
 *    built-in default (Starter) plan so existing instructors are not left
 *    without an entitlement. Instructors who already have ACTIVE subscriptions
 *    (whether the legacy free plan or an upgraded plan) are left untouched.
 */
async function main() {
  await mongoose.connect(env.mongodbUri);

  let created = 0;
  let updated = 0;

  for (const code of CANONICAL_PLAN_CODES) {
    const seed = DEFAULT_INSTRUCTOR_PLANS[code];
    const existing = await InstructorSubscriptionPlan.findOne({ code });

    if (existing) {
      const patch: Record<string, any> = {};
      for (const [key, value] of Object.entries(seed)) {
        if (key === 'code' || key === 'name') continue;
        if ((existing as any)[key] === undefined || (existing as any)[key] === null) {
          patch[key] = value;
        }
      }
      if (Object.keys(patch).length > 0) {
        await InstructorSubscriptionPlan.updateOne({ _id: existing._id }, { $set: patch });
        updated += 1;
        logger.info(`Plan ${code}: filled missing fields ${Object.keys(patch).join(', ')}`);
      } else {
        logger.info(`Plan ${code}: unchanged`);
      }
      continue;
    }

    await InstructorSubscriptionPlan.create({
      code: seed.code,
      name: seed.name,
      type: seed.type,
      price: seed.price,
      discountPrice: seed.discountPrice,
      durationDays: seed.durationDays,
      description: seed.description,
      sortOrder: seed.sortOrder,
      isDefaultForFree: seed.isDefaultForFree,
      status: 'active',
      features: seed.legacyFeatures,
      entitlements: seed.entitlements,
    });
    created += 1;
    logger.info(`Plan ${code}: created`);
  }

  // ─── Grant the default plan to instructors without an active subscription ───
  const instructors = await User.find({ role: ROLES.INSTRUCTOR }).select('_id email').lean();
  const starter = await InstructorSubscriptionPlan.findOne({ code: 'STARTER' });
  let granted = 0;

  if (starter) {
    for (const instructor of instructors) {
      const hasActive = await InstructorSubscription.findOne({
        instructor: instructor._id,
        status: { $in: ['ACTIVE', 'active'] },
      });
      if (hasActive) continue;

      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + (starter.durationDays || 365));
      await InstructorSubscription.create({
        instructor: instructor._id,
        plan: starter._id,
        planSnapshot: {
          code: starter.code,
          name: starter.name,
          type: starter.type,
          price: starter.price ?? 0,
          durationDays: starter.durationDays || 365,
        },
        startDate: start,
        endDate: end,
        status: 'ACTIVE',
      });
      granted += 1;
      logger.info(`Granted Starter plan to ${instructor.email || instructor._id}`);
    }
  }

  logger.info(`Seeding complete: ${created} created, ${updated} patched, ${granted} starter grants`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  logger.error('Plan seeding failed', error);
  await mongoose.disconnect();
  process.exit(1);
});
