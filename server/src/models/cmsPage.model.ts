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
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 50000 },
    metaTitle: { type: String, trim: true, maxlength: 200 },
    metaDescription: { type: String, trim: true, maxlength: 300 },
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
