import mongoose, { Schema, Document } from 'mongoose';

export interface IInstructorApplication extends Document {
  user: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  photo: { url: string; publicId: string };
  resume: { url: string; publicId: string };
  qualification: string;
  experience: string;
  linkedin: string;
  github: string;
  portfolio: string;
  website: string;
  bio: string;
  teachingCategories: string[];
  demoVideo: { url: string; publicId: string };
  identityProof: { url: string; publicId: string };
  taxDetails: { pan: string; gst: string };
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch: string;
    upiId: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const instructorApplicationSchema = new Schema<IInstructorApplication>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    photo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    resume: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    qualification: { type: String, required: true },
    experience: { type: String, required: true },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    website: { type: String, default: '' },
    bio: { type: String, default: '' },
    teachingCategories: [{ type: String }],
    demoVideo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    identityProof: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    taxDetails: {
      pan: { type: String, default: '' },
      gst: { type: String, default: '' },
    },
    bankDetails: {
      accountHolderName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
      branch: { type: String, default: '' },
      upiId: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    adminNote: { type: String },
  },
  { timestamps: true }
);

export const InstructorApplication = mongoose.model<IInstructorApplication>(
  'InstructorApplication',
  instructorApplicationSchema
);
