import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformSettings extends Document {
  platformName: string;
  platformEmail: string;
  logo: { url: string; publicId: string };
  favicon: { url: string; publicId: string };
  metaDescription: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  defaultUserRole: 'student' | 'instructor';
  currency: string;
  commissionPercentage: number;
  gstPercentage: number;
  minimumPayoutAmount: number;
  supportEmail: string;
  timezone: string;
  defaultInstructorPlan: string;
  refundWindowDays: number;
  socialLinks: {
    youtube: string;
    twitter: string;
    linkedin: string;
    instagram: string;
  };
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    platformName: {
      type: String,
      default: 'NextEra',
      maxlength: 100,
    },
    platformEmail: {
      type: String,
      default: '',
      maxlength: 254,
    },
    logo: {
      url: { type: String, default: '', maxlength: 500 },
      publicId: { type: String, default: '', maxlength: 200 },
    },
    favicon: {
      url: { type: String, default: '', maxlength: 500 },
      publicId: { type: String, default: '', maxlength: 200 },
    },
    metaDescription: {
      type: String,
      default: '',
      maxlength: 300,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    allowRegistration: {
      type: Boolean,
      default: true,
    },
    defaultUserRole: {
      type: String,
      enum: ['student', 'instructor'],
      default: 'student',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    commissionPercentage: {
      type: Number,
      default: 25,
      min: 0,
      max: 100,
    },
    gstPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    minimumPayoutAmount: {
      type: Number,
      default: 100,
      min: 0,
    },
    supportEmail: {
      type: String,
      default: '',
      maxlength: 254,
    },
    timezone: {
      type: String,
      default: 'UTC',
      maxlength: 50,
    },
    defaultInstructorPlan: {
      type: String,
      default: 'none',
      maxlength: 100,
    },
    refundWindowDays: {
      type: Number,
      default: 14,
      min: 0,
    },
    socialLinks: {
      youtube: { type: String, default: '', maxlength: 500 },
      twitter: { type: String, default: '', maxlength: 500 },
      linkedin: { type: String, default: '', maxlength: 500 },
      instagram: { type: String, default: '', maxlength: 500 },
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const PlatformSettings = mongoose.model<IPlatformSettings>('PlatformSettings', platformSettingsSchema);
