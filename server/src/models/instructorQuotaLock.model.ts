import mongoose, { Schema, Document } from 'mongoose';

/**
 * Per-instructor advisory lock used to serialize course-creation quota checks
 * (and other quota-sensitive operations). Works on any MongoDB topology: the
 * acquire is a single atomic `findOneAndUpdate`, so concurrent acquirers never
 * both win. Leases expire after LOCK_TIMEOUT_MS so a crashed holder cannot
 * permanently block an instructor.
 */
export interface IInstructorQuotaLock extends Document {
  instructor: mongoose.Types.ObjectId;
  acquiredAt: Date;
  leaseExpiresAt: Date;
}

const instructorQuotaLockSchema = new Schema<IInstructorQuotaLock>(
  {
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    acquiredAt: { type: Date, default: Date.now },
    leaseExpiresAt: { type: Date, required: true },
  },
  { versionKey: false }
);

export const InstructorQuotaLock = mongoose.model<IInstructorQuotaLock>(
  'InstructorQuotaLock',
  instructorQuotaLockSchema
);
