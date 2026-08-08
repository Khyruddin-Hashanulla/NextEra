import mongoose, { Schema, Document } from 'mongoose';

export type CertificateStatus = 'active' | 'revoked';

export interface ICertificateMetadata {
  categoryName: string;
  courseDuration: number;
  courseLevel: string;
  instructorName: string;
}

export interface ICertificate extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrollment: mongoose.Types.ObjectId;
  certificateId: string;
  verificationUrl: string;
  qrCodeUrl: string;
  certificateUrl: string;
  pdfUrl: string;
  digitalSignature: string;
  status: CertificateStatus;
  version: number;
  metadata?: ICertificateMetadata;
  issuedAt: Date;
  downloadedAt?: Date;
  verifiedAt?: Date;
  revokedAt?: Date;
  revokedReason?: string;
  restoredAt?: Date;
  createdAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    enrollment: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, unique: true },
    certificateId: { type: String, required: true, unique: true, maxlength: 100 },
    verificationUrl: { type: String, required: true, maxlength: 500 },
    qrCodeUrl: { type: String, required: true, maxlength: 500 },
    certificateUrl: { type: String, required: true, maxlength: 500 },
    pdfUrl: { type: String, default: '', maxlength: 500 },
    digitalSignature: { type: String, required: true, maxlength: 500 },
    status: { type: String, enum: ['active', 'revoked'], default: 'active', index: true },
    version: { type: Number, default: 1 },
    metadata: {
      categoryName: { type: String, default: '' },
      courseDuration: { type: Number, default: 0 },
      courseLevel: { type: String, default: '' },
      instructorName: { type: String, default: '' },
    },
    issuedAt: { type: Date, default: Date.now },
    downloadedAt: { type: Date },
    verifiedAt: { type: Date },
    revokedAt: { type: Date },
    revokedReason: { type: String, maxlength: 500 },
    restoredAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

certificateSchema.index({ user: 1, course: 1 }, { unique: true });
certificateSchema.index({ status: 1, createdAt: -1 });

export const Certificate = mongoose.model<ICertificate>('Certificate', certificateSchema);
