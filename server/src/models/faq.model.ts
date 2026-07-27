import mongoose, { Schema, Document } from 'mongoose';

export interface IFaq extends Document {
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    category: { type: String, default: 'general', trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

faqSchema.index({ category: 1, order: 1 });

export const Faq = mongoose.model<IFaq>('Faq', faqSchema);
