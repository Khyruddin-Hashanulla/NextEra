import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureToggle extends Document {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'general' | 'payment' | 'social' | 'ai' | 'communication' | 'security';
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const featureToggleSchema = new Schema<IFeatureToggle>(
  {
    key: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    category: {
      type: String,
      enum: ['general', 'payment', 'social', 'ai', 'communication', 'security'],
      default: 'general',
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const FeatureToggle = mongoose.model<IFeatureToggle>('FeatureToggle', featureToggleSchema);

export const DEFAULT_FEATURES = [
  { key: 'public_registration', name: 'Public Registration', description: 'Allow new users to register', enabled: true, category: 'general' as const },
  { key: 'instructor_applications', name: 'Instructor Applications', description: 'Allow users to apply as instructors', enabled: true, category: 'general' as const },
  { key: 'course_reviews', name: 'Course Reviews', description: 'Allow students to review courses', enabled: true, category: 'general' as const },
  { key: 'discussions', name: 'Course Discussions', description: 'Enable Q&A discussions on courses', enabled: true, category: 'communication' as const },
  { key: 'live_classes', name: 'Live Classes', description: 'Enable Zoom live class scheduling', enabled: true, category: 'general' as const },
  { key: 'certificates', name: 'Certificates', description: 'Allow generating course completion certificates', enabled: true, category: 'general' as const },
  { key: 'affiliate_system', name: 'Affiliate System', description: 'Enable referral-based affiliate program', enabled: true, category: 'general' as const },
  { key: 'blog_comments', name: 'Blog Comments', description: 'Allow comments on blog posts', enabled: true, category: 'communication' as const },
  { key: 'ai_features', name: 'AI Features', description: 'Enable AI-powered content generation', enabled: false, category: 'ai' as const },
  { key: 'social_login', name: 'Social Login', description: 'Allow Google OAuth login', enabled: true, category: 'social' as const },
  { key: 'payment_gateway', name: 'Payment Gateway', description: 'Enable Razorpay payment processing', enabled: true, category: 'payment' as const },
  { key: 'instructor_payouts', name: 'Instructor Payouts', description: 'Enable automatic instructor payouts', enabled: true, category: 'payment' as const },
  { key: 'coupon_system', name: 'Coupon System', description: 'Allow instructors to create coupons', enabled: true, category: 'general' as const },
  { key: 'bundles', name: 'Course Bundles', description: 'Enable course bundle creation and purchase', enabled: true, category: 'general' as const },
  { key: 'subscriptions', name: 'Student Subscriptions', description: 'Enable monthly subscription plans for students', enabled: true, category: 'payment' as const },
  { key: 'coding_platform', name: 'Coding Platform', description: 'Enable interactive coding problems', enabled: true, category: 'general' as const },
];
