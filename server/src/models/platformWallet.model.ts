import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformWallet extends Document {
  totalRevenue: number;
  totalCommissionCollected: number;
  totalPayoutsMade: number;
  currentBalance: number;
  pendingPayouts: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const platformWalletSchema = new Schema<IPlatformWallet>(
  {
    totalRevenue: { type: Number, default: 0 },
    totalCommissionCollected: { type: Number, default: 0 },
    totalPayoutsMade: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    pendingPayouts: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PlatformWallet = mongoose.model<IPlatformWallet>('PlatformWallet', platformWalletSchema);
