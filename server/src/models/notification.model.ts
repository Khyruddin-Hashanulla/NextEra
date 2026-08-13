import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'system' | 'course' | 'payment' | 'enrollment' | 'approval' | 'referral' | 'assignment';
  isRead: boolean;
  link?: string;
  course?: mongoose.Types.ObjectId;
  announcement?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
    },
    type: {
      type: String,
      enum: ['system', 'course', 'payment', 'enrollment', 'approval', 'referral', 'assignment'],
      default: 'system',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: String,
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    announcement: {
      type: Schema.Types.ObjectId,
      ref: 'Announcement',
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
