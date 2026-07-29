import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificate extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrollment: mongoose.Types.ObjectId;
  certificateId: string;
  qrCodeUrl: string;
  certificateUrl: string;
  digitalSignature: string;
  issuedAt: Date;
  createdAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    enrollment: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, unique: true },
    certificateId: { type: String, required: true, unique: true, maxlength: 100 },
    qrCodeUrl: { type: String, required: true, maxlength: 500 },
    certificateUrl: { type: String, required: true, maxlength: 500 },
    digitalSignature: { type: String, required: true, maxlength: 500 },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

certificateSchema.index({ user: 1, course: 1 }, { unique: true });

export const Certificate = mongoose.model<ICertificate>('Certificate', certificateSchema);
