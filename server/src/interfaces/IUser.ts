import mongoose, { Document } from 'mongoose';
import { Role } from '../constants/roles';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: Role;
  avatar: { url: string; publicId: string };
  bio: string;
  phone?: string;
  address?: string;
  socialLinks: {
    youtube: string;
    twitter: string;
    linkedin: string;
    github: string;
    portfolio?: string;
    website?: string;
  };
  isEmailVerified: boolean;
  googleId?: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  lockLevel: number;
  lastFailedLogin?: Date;
  lastFailedLoginIp?: string;
  tokenVersion: number;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  referredBy?: mongoose.Types.ObjectId;
  referredAt?: Date;
  instructorProfile?: {
    qualification: string;
    experience: string;
    expertise: string[];
    resume?: { url: string; publicId: string };
    identityProof?: { url: string; publicId: string };
    demoVideo?: { url: string; publicId: string };
    taxDetails?: { pan: string; gst: string };
    bankDetails?: {
      accountHolderName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      branch: string;
      upiId: string;
    };
    teachingCategories: string[];
    completedCourses: number;
    totalStudents: number;
    totalEarnings: number;
    rating: number;
    subscriptionStatus: 'none' | 'basic' | 'standard' | 'premium';
    subscriptionExpiry?: Date;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserResponse {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatar: { url: string; publicId: string };
  bio: string;
  phone?: string;
  address?: string;
  socialLinks: { youtube: string; twitter: string; linkedin: string; github: string; portfolio?: string; website?: string };
  isEmailVerified: boolean;
  instructorProfile?: IUser['instructorProfile'];
  createdAt: Date;
}

export interface TokenPayload {
  userId: string;
  role: Role;
  email: string;
  jti?: string;
  tokenVersion?: number;
}
