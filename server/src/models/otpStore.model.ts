import mongoose, { Schema, Document } from 'mongoose';

export interface IOTPStore extends Document {
  email: string;
  otp: string;
  purpose: 'email_verification' | 'password_reset';
  expiresAt: Date;
  createdAt: Date;
}

const otpStoreSchema = new Schema<IOTPStore>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
    },
    purpose: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      required: [true, 'Purpose is required'],
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

otpStoreSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTPStore = mongoose.model<IOTPStore>('OTPStore', otpStoreSchema);
