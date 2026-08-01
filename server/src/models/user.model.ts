import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../interfaces/IUser';
import { ROLES } from '../constants/roles';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
    },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    socialLinks: {
      youtube: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date },
    lockLevel: { type: Number, default: 0 },
    lastFailedLogin: { type: Date },
    lastFailedLoginIp: { type: String },
    tokenVersion: { type: Number, default: 0 },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    referredAt: { type: Date },
    instructorProfile: {
      qualification: { type: String, default: '' },
      experience: { type: String, default: '' },
      expertise: [{ type: String }],
      resume: {
        url: { type: String, default: '' },
        publicId: { type: String, default: '' },
      },
      identityProof: {
        url: { type: String, default: '' },
        publicId: { type: String, default: '' },
      },
      demoVideo: {
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
      teachingCategories: [{ type: String }],
      completedCourses: { type: Number, default: 0 },
      totalStudents: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      subscriptionStatus: {
        type: String,
        enum: ['none', 'basic', 'standard', 'premium'],
        default: 'none',
      },
      subscriptionExpiry: { type: Date },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: Record<string, any>) {
        delete ret.__v;
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
