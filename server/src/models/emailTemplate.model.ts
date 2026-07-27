import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailTemplate extends Document {
  name: string;
  slug: string;
  subject: string;
  body: string;
  variables: string[];
  category: 'auth' | 'notification' | 'marketing' | 'transactional';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const emailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    variables: [{ type: String }],
    category: {
      type: String,
      enum: ['auth', 'notification', 'marketing', 'transactional'],
      default: 'notification',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const EmailTemplate = mongoose.model<IEmailTemplate>('EmailTemplate', emailTemplateSchema);
