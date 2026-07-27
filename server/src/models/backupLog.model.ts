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
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    type: { type: String, enum: ['full', 'partial'], default: 'full' },
    collections: [{ type: String }],
    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      default: 'running',
    },
    url: { type: String },
    error: { type: String },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    createdBy: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const BackupLog = mongoose.model<IBackupLog>('BackupLog', backupLogSchema);
