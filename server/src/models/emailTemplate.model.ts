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
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, maxlength: 200 },
    subject: { type: String, required: true, maxlength: 500 },
    body: { type: String, required: true, maxlength: 50000 },
    variables: [{ type: String, maxlength: 100 }],
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
