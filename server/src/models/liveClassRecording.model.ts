import mongoose, { Schema, Document } from 'mongoose';

export interface ILiveClassRecording extends Document {
  liveClass: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  instructor: mongoose.Types.ObjectId;
  title: string;
  description: string;
  url: string;
  password: string;
  duration: number;
  fileSize: number;
  format: string;
  zoomRecordingId: string;
  status: 'processing' | 'available' | 'failed';
  thumbnailUrl: string;
  views: number;
  downloadable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const liveClassRecordingSchema = new Schema<ILiveClassRecording>(
  {
    liveClass: { type: Schema.Types.ObjectId, ref: 'LiveClass', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    url: { type: String, required: true },
    password: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    fileSize: { type: Number, default: 0 },
    format: { type: String, default: 'mp4' },
    zoomRecordingId: { type: String, default: '' },
    status: { type: String, enum: ['processing', 'available', 'failed'], default: 'processing' },
    thumbnailUrl: { type: String, default: '' },
    views: { type: Number, default: 0 },
    downloadable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const LiveClassRecording = mongoose.model<ILiveClassRecording>(
  'LiveClassRecording',
  liveClassRecordingSchema
);
