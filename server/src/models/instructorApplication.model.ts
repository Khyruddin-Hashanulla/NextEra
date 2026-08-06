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
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const instructorApplicationSchema = new Schema<IInstructorApplication>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true, maxlength: 200 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, required: true, maxlength: 20 },
    address: { type: String, required: true, maxlength: 500 },
    photo: {
      url: { type: String, default: '', maxlength: 500 },
      publicId: { type: String, default: '', maxlength: 200 },
    },
    resume: {
      url: { type: String, default: '', maxlength: 500 },
      publicId: { type: String, default: '', maxlength: 200 },
    },
    qualification: { type: String, required: true, maxlength: 500 },
    experience: { type: String, required: true, maxlength: 5000 },
    linkedin: { type: String, default: '', maxlength: 500 },
    github: { type: String, default: '', maxlength: 500 },
    portfolio: { type: String, default: '', maxlength: 500 },
    website: { type: String, default: '', maxlength: 500 },
    bio: { type: String, default: '', maxlength: 2000 },
    teachingCategories: [{ type: String, maxlength: 100 }],
    demoVideo: {
      url: { type: String, default: '', maxlength: 500 },
      publicId: { type: String, default: '', maxlength: 200 },
    },
    identityProof: {
      url: { type: String, default: '', maxlength: 500 },
      publicId: { type: String, default: '', maxlength: 200 },
    },
    taxDetails: {
      pan: { type: String, default: '', maxlength: 20 },
      gst: { type: String, default: '', maxlength: 20 },
    },
    bankDetails: {
      accountHolderName: { type: String, default: '', maxlength: 200 },
      accountNumber: { type: String, default: '', maxlength: 50 },
      ifscCode: { type: String, default: '', maxlength: 20 },
      bankName: { type: String, default: '', maxlength: 200 },
      branch: { type: String, default: '', maxlength: 200 },
      upiId: { type: String, default: '', maxlength: 100 },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    adminNote: { type: String, maxlength: 2000 },
    rejectionReason: { type: String, maxlength: 2000 },
  },
  { timestamps: true }
);

export const InstructorApplication = mongoose.model<IInstructorApplication>(
  'InstructorApplication',
  instructorApplicationSchema
);
