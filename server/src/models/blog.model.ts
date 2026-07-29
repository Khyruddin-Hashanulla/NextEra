import mongoose, { Schema, Document } from 'mongoose';

export interface ISeoMetadata {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImage: string;
}

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: { url: string; publicId: string };
  author: mongoose.Types.ObjectId;
  tags: string[];
  categories: string[];
  status: 'draft' | 'published';
  isFeatured: boolean;
  readCount: number;
  readingTime: number;
  seo: ISeoMetadata;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
      maxlength: 50000,
    },
    excerpt: {
      type: String,
      default: '',
      maxlength: [300, 'Excerpt cannot exceed 300 characters'],
    },
    featuredImage: {
      url: { type: String, default: '', maxlength: 500 },
      publicId: { type: String, default: '', maxlength: 200 },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [{ type: String, trim: true, maxlength: 50 }],
    categories: [{ type: String, trim: true, lowercase: true, maxlength: 50 }],
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    isFeatured: { type: Boolean, default: false },
    readCount: { type: Number, default: 0 },
    readingTime: { type: Number, default: 0 },
    seo: {
      metaTitle: { type: String, default: '', maxlength: 200 },
      metaDescription: { type: String, default: '', maxlength: 300 },
      canonicalUrl: { type: String, default: '', maxlength: 500 },
      ogImage: { type: String, default: '', maxlength: 500 },
    },
    publishedAt: Date,
  },
  { timestamps: true }
);

export const Blog = mongoose.model<IBlog>('Blog', blogSchema);
