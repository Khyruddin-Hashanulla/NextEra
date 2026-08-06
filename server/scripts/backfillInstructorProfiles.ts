import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { logger } from '../src/utils/logger';
import { User } from '../src/models/user.model';
import { InstructorApplication } from '../src/models/instructorApplication.model';
import { mergeInstructorApplicationIntoUser } from '../src/utils/applyInstructorApplication';

/**
 * One-time backfill: copy each approved application's submitted profile data
 * onto the matching User document. Approvals performed before the approval
 * flow started merging the application into the user left that data orphaned,
 * so approved instructors only showed name/bio on the public profile page.
 *
 * Idempotent and safe to re-run: application values already copied will simply
 * be copied again.
 */
async function main() {
  await mongoose.connect(env.mongodbUri);

  const applications = await InstructorApplication.find({ status: 'approved' });
  let updated = 0;

  for (const application of applications) {
    const user = await User.findById(application.user);
    if (!user) {
      logger.warn(`Skipping application ${application._id}: user ${application.user} not found`);
      continue;
    }
    mergeInstructorApplicationIntoUser(user, application);
    await user.save();
    updated += 1;
    logger.info(`Backfilled instructor profile for ${user.email}`);
  }

  logger.info(`Backfilled ${updated} instructor profile(s)`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  logger.error('Backfill failed', error);
  await mongoose.disconnect();
  process.exit(1);
});
