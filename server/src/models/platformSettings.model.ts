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
    },
    platformEmail: {
      type: String,
      default: '',
    },
    logo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    favicon: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    metaDescription: {
      type: String,
      default: '',
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
    socialLinks: {
      youtube: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const PlatformSettings = mongoose.model<IPlatformSettings>('PlatformSettings', platformSettingsSchema);
