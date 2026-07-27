import mongoose, { Schema, Document } from 'mongoose';

export interface ICmsPage extends Document {
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  published: boolean;
  publishedAt?: Date;
  layout: 'default' | 'full_width' | 'sidebar';
  createdAt: Date;
  updatedAt: Date;
}

const cmsPageSchema = new Schema<ICmsPage>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, required: true },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    layout: {
      type: String,
      enum: ['default', 'full_width', 'sidebar'],
      default: 'default',
    },
  },
  { timestamps: true }
);

export const CmsPage = mongoose.model<ICmsPage>('CmsPage', cmsPageSchema);
