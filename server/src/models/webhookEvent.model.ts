import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
  eventId: string;
  eventType: string;
  paymentId: string;
  orderId: string;
  status: 'processed' | 'pending' | 'failed';
  payloadHash: string;
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      maxlength: 200,
    },
    eventType: {
      type: String,
      required: true,
      maxlength: 200,
    },
    paymentId: {
      type: String,
      default: '',
      maxlength: 200,
    },
    orderId: {
      type: String,
      default: '',
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ['processed', 'pending', 'failed'],
      default: 'processed',
    },
    payloadHash: {
      type: String,
      required: true,
      maxlength: 500,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

webhookEventSchema.index({ paymentId: 1 });
webhookEventSchema.index({ orderId: 1 });

export const WebhookEvent = mongoose.model<IWebhookEvent>('WebhookEvent', webhookEventSchema);
