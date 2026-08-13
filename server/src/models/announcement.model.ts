import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAnnouncement extends Document {
  course: Types.ObjectId;
  instructor: Types.ObjectId;
  title: string;
  message: string;
  attachments: { url: string; publicId: string; name: string }[];
  sendEmail: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 5000 },
    attachments: [
      {
        url: { type: String, maxlength: 500 },
        publicId: { type: String, maxlength: 200 },
        name: { type: String, maxlength: 200 },
      },
    ],
    sendEmail: { type: Boolean, default: false },
  },
  { timestamps: true }
);

announcementSchema.index({ course: 1, createdAt: -1 });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
