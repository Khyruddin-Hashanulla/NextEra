import mongoose, { Schema, Document } from 'mongoose';

/**
 * Immutable audit trail of every course-creation event.
 *
 * The rolling 30-day creation quota counts these events — never the number of
 * currently existing (or published) courses. Events are intentionally NOT
 * removed when a course is deleted, so deletion does not reset an instructor's
 * quota.
 */
export interface ICourseCreationEvent extends Document {
  instructor: mongoose.Types.ObjectId;
  /** Reference to the created course. Nulled (not removed) on course deletion. */
  course?: mongoose.Types.ObjectId | null;
  /** Plan/subscription the instructor held at creation time (context only). */
  plan?: mongoose.Types.ObjectId | null;
  subscription?: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

const courseCreationEventSchema = new Schema<ICourseCreationEvent>(
  {
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', default: null },
    plan: { type: Schema.Types.ObjectId, ref: 'InstructorSubscriptionPlan', default: null },
    subscription: { type: Schema.Types.ObjectId, ref: 'InstructorSubscription', default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

courseCreationEventSchema.index({ instructor: 1, createdAt: -1 });
// Prevents double-recording the same course under any race/replay condition.
// Partial on `course` so events whose course was detached (set to null on course
// deletion) never collide: the unique key must only apply while a live course is
// referenced.
courseCreationEventSchema.index(
  { instructor: 1, course: 1 },
  { unique: true, partialFilterExpression: { course: { $type: 'objectId' } } }
);

export const CourseCreationEvent = mongoose.model<ICourseCreationEvent>(
  'CourseCreationEvent',
  courseCreationEventSchema
);
