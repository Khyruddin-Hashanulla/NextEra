import mongoose, { Schema, Document } from 'mongoose';

export interface IBackupLog extends Document {
  fileName: string;
  fileSize: number;
  type: 'full' | 'partial';
  collections: string[];
  status: 'running' | 'completed' | 'failed';
  url?: string;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  createdBy?: string;
  createdAt: Date;
}

const backupLogSchema = new Schema<IBackupLog>(
  {
    fileName: { type: String, required: true, maxlength: 255 },
    fileSize: { type: Number, default: 0 },
    type: { type: String, enum: ['full', 'partial'], default: 'full' },
    collections: [{ type: String, maxlength: 100 }],
    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      default: 'running',
    },
    url: { type: String, maxlength: 500 },
    error: { type: String, maxlength: 5000 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    createdBy: { type: String, maxlength: 200 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const BackupLog = mongoose.model<IBackupLog>('BackupLog', backupLogSchema);
