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
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 5000 },
    url: { type: String, required: true, maxlength: 500 },
    password: { type: String, default: '', maxlength: 200 },
    duration: { type: Number, default: 0 },
    fileSize: { type: Number, default: 0 },
    format: { type: String, default: 'mp4', maxlength: 20 },
    zoomRecordingId: { type: String, default: '', maxlength: 200 },
    status: { type: String, enum: ['processing', 'available', 'failed'], default: 'processing' },
    thumbnailUrl: { type: String, default: '', maxlength: 500 },
    views: { type: Number, default: 0 },
    downloadable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const LiveClassRecording = mongoose.model<ILiveClassRecording>(
  'LiveClassRecording',
  liveClassRecordingSchema
);
