import mongoose, { Schema, Document } from 'mongoose';

export interface ICoursePricing {
  originalPrice: number;
  discountPercent: number;
  hasDiscount: boolean;
  gstPercent: number;
  gstInclusive: boolean;
}

export interface ICourseIntroVideo {
  source: 'youtube' | 'vimeo' | 'bunny' | 's3' | 'direct' | 'none';
  url: string;
  videoId: string;
  posterUrl: string;
}

export interface ICourseCertificateSettings {
  enabled: boolean;
  template: string;
  issueAutomatically: boolean;
  passingCriteria: 'completion' | 'quiz_score';
  minimumQuizScore: number;
}

export interface ICourseMeta {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: { url: string; publicId: string };
  introVideo: ICourseIntroVideo;
  welcomeMessage: string;
  congratulationMessage: string;
  pricing: ICoursePricing;
  price: number;
  category: mongoose.Types.ObjectId;
  instructor: mongoose.Types.ObjectId;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  language: string;
  prerequisites: string;
  benefits: string;
  requirements: string[];
  tags: string[];
  whatYouWillLearn: string[];
  visibility: 'public' | 'private';
  courseType: 'paid' | 'free' | 'draft' | 'private';
  status: 'draft' | 'review' | 'approved' | 'published' | 'rejected' | 'archived';
  isApproved: boolean;
  isActive: boolean;
  rejectionReason: string;
  publishedAt: Date | null;
  archivedAt: Date | null;
  featured: boolean;
  badge: string;
  totalDuration: number;
  totalLectures: number;
  totalSections: number;
  totalResources: number;
  averageRating: number;
  totalReviews: number;
  totalEnrollments: number;
  certificateSettings: ICourseCertificateSettings;
  meta: ICourseMeta;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: { type: String, default: '' },
    shortDescription: {
      type: String,
      default: '',
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    thumbnail: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    introVideo: {
      source: { type: String, enum: ['youtube', 'vimeo', 'bunny', 's3', 'direct', 'none'], default: 'none' },
      url: { type: String, default: '' },
      videoId: { type: String, default: '' },
      posterUrl: { type: String, default: '' },
    },
    welcomeMessage: { type: String, default: '' },
    congratulationMessage: { type: String, default: '' },
    pricing: {
      originalPrice: { type: Number, default: 0 },
      discountPercent: { type: Number, default: 0 },
      hasDiscount: { type: Boolean, default: false },
      gstPercent: { type: Number, default: 0 },
      gstInclusive: { type: Boolean, default: true },
    },
    price: { type: Number, default: 0, min: [0, 'Price must be positive'] },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'all'],
      default: 'beginner',
    },
    language: { type: String, default: 'English' },
    prerequisites: { type: String, default: '' },
    benefits: { type: String, default: '' },
    requirements: [String],
    tags: [String],
    whatYouWillLearn: [String],
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    courseType: {
      type: String,
      enum: ['paid', 'free', 'draft', 'private'],
      default: 'draft',
    },
    status: {
      type: String,
      enum: ['draft', 'review', 'approved', 'published', 'rejected', 'archived'],
      default: 'draft',
    },
    isApproved: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    rejectionReason: { type: String, default: '' },
    publishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    featured: { type: Boolean, default: false },
    badge: { type: String, default: '' },
    totalDuration: { type: Number, default: 0 },
    totalLectures: { type: Number, default: 0 },
    totalSections: { type: Number, default: 0 },
    totalResources: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    totalEnrollments: { type: Number, default: 0 },
    certificateSettings: {
      enabled: { type: Boolean, default: true },
      template: { type: String, default: 'default' },
      issueAutomatically: { type: Boolean, default: true },
      passingCriteria: { type: String, enum: ['completion', 'quiz_score'], default: 'completion' },
      minimumQuizScore: { type: Number, default: 60 },
    },
    meta: {
      seoTitle: { type: String, default: '' },
      seoDescription: { type: String, default: '' },
      seoKeywords: [String],
    },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

courseSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  if (this.isModified('status') || this.isNew) {
    const s = this.status;

    if (s === 'published') {
      this.isApproved = true;
      this.isActive = true;
      this.visibility = 'public';
      if (!this.publishedAt) this.publishedAt = new Date();
    }

    if (s === 'archived') {
      this.isActive = false;
      this.visibility = 'private';
      if (!this.archivedAt) this.archivedAt = new Date();
    }

    if (s === 'draft' || s === 'rejected') {
      this.isApproved = false;
      this.visibility = 'private';
    }

    if (s === 'review' || s === 'approved') {
      this.visibility = 'private';
    }
  }

  next();
});

courseSchema.index({ slug: 1 }, { unique: true, sparse: true });
courseSchema.index({ status: 1, isApproved: 1 });
courseSchema.index({ instructor: 1, status: 1 });
courseSchema.index({ featured: 1, status: 1 });

export const Course = mongoose.model<ICourse>('Course', courseSchema);
