import mongoose, { Schema, Document } from 'mongoose';

export const RECORDING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DELETED: 'deleted',
} as const;

export type RecordingStatus = (typeof RECORDING_STATUS)[keyof typeof RECORDING_STATUS] | 'available';

// 'available' is kept as a legacy status for records created before the
// recording-status model was introduced. Completed recordings queries should
// use COMPLETED_RECORDING_STATUSES so legacy records remain visible.
export const COMPLETED_RECORDING_STATUSES: readonly string[] = [RECORDING_STATUS.COMPLETED, 'available'];

const RECORDING_STATUS_VALUES: readonly string[] = [
  RECORDING_STATUS.PENDING,
  RECORDING_STATUS.PROCESSING,
  RECORDING_STATUS.COMPLETED,
  RECORDING_STATUS.FAILED,
  RECORDING_STATUS.DELETED,
  'available',
];

export interface ILiveClassRecording extends Document {
  liveClass: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  instructor: mongoose.Types.ObjectId;
  title: string;
  description: string;
  topic: string;
  url: string;
  playUrl: string;
  downloadUrl: string;
  password: string;
  duration: number;
  fileSize: number;
  format: string;
  zoomRecordingId: string;
  meetingId: string;
  hostId: string;
  recordingStart: Date;
  recordingEnd: Date;
  status: RecordingStatus;
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
    topic: { type: String, default: '', maxlength: 500 },
    url: { type: String, required: true, maxlength: 500 },
    playUrl: { type: String, default: '', maxlength: 500 },
    downloadUrl: { type: String, default: '', maxlength: 500 },
    password: { type: String, default: '', maxlength: 200 },
    duration: { type: Number, default: 0 },
    fileSize: { type: Number, default: 0 },
    format: { type: String, default: 'mp4', maxlength: 20 },
    zoomRecordingId: { type: String, default: '', maxlength: 200 },
    meetingId: { type: String, default: '', maxlength: 200 },
    hostId: { type: String, default: '', maxlength: 200 },
    recordingStart: { type: Date },
    recordingEnd: { type: Date },
    status: { type: String, enum: RECORDING_STATUS_VALUES, default: 'processing' },
    thumbnailUrl: { type: String, default: '', maxlength: 500 },
    views: { type: Number, default: 0 },
    downloadable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

liveClassRecordingSchema.index({ liveClass: 1, status: 1 });
liveClassRecordingSchema.index({ course: 1, status: 1 });
liveClassRecordingSchema.index({ instructor: 1, createdAt: -1 });
liveClassRecordingSchema.index({ zoomRecordingId: 1 });

export const LiveClassRecording = mongoose.model<ILiveClassRecording>('LiveClassRecording', liveClassRecordingSchema);
