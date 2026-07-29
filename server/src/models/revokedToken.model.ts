import mongoose, { Schema, Document } from 'mongoose';

export interface IRevokedToken extends Document {
  jti: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
}

const revokedTokenSchema = new Schema<IRevokedToken>({
  jti: {
    type: String,
    required: true,
    unique: true,
    index: true,
    maxlength: 500,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
});

export const RevokedToken = mongoose.model<IRevokedToken>('RevokedToken', revokedTokenSchema);
