import mongoose, { Schema, Document } from 'mongoose';

// ─── Plan entitlements (structured, source of truth) ───────────
export interface IPlanEntitlements {
  courses: {
    canCreateFree: boolean;
    canCreatePaid: boolean;
    maxCreationCount: number;
    creationWindowDays: number;
    maxPublishedCourses: number;
    unlimitedCreationMode: boolean;
    highCreationCap: number;
  };
  students: {
    maxStudents: number;
  };
  revenue: {
    enabled: boolean;
    commissionPercent: number;
    instructorSharePercent: number;
  };
  storage: {
    videoGB: number;
    materialGB: number;
    recordingGB: number;
    maxVideoFileSizeMB: number;
    /** Flag when the plan grants unlimited (video) storage. Mirrors the legacy
     *  flat `unlimitedStorage` feature; the flat feature is always re-derived
     *  from this field so the admin toggle survives a save. */
    unlimited?: boolean;
  };
  certificates: {
    enabled: boolean;
    qrVerification: boolean;
  };
  liveClasses: {
    enabled: boolean;
    monthlyLimit: number;
    maxDurationMinutes: number;
    recording: boolean;
  };
  analytics: {
    basic: boolean;
    advanced: boolean;
    revenue: boolean;
    export: boolean;
  };
  marketing: {
    coupons: boolean;
    maxActiveCoupons: number;
    bundles: boolean;
    instructorSubscriptions: boolean;
    affiliate: boolean;
    affiliatePayout: boolean;
  };
  support: {
    level: 'none' | 'email' | 'priority' | 'dedicated';
  };
}

// ─── Legacy flat features (kept populated for backward compat) ──
export interface IPlanLegacyFeatures {
  freeCoursesLimit: number;
  unlimitedCourses: boolean;
  storageLimitMB: number;
  advancedAnalytics: boolean;
  coupons: boolean;
  liveClasses: boolean;
  featuredInstructor: boolean;
  prioritySupport: boolean;
  unlimitedStorage: boolean;
  premiumMarketing: boolean;
}

export interface IInstructorSubscriptionPlan extends Document {
  code: string;
  name: string;
  type: 'free' | 'paid';
  price: number;
  discountPrice: number;
  durationDays: number;
  description: string;
  features: IPlanLegacyFeatures;
  entitlements?: IPlanEntitlements;
  status: 'active' | 'inactive';
  isDefaultForFree: boolean;
  totalSubscribers: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const entitlementsSchema = new Schema<IPlanEntitlements>(
  {
    courses: {
      canCreateFree: { type: Boolean, default: true },
      canCreatePaid: { type: Boolean, default: false },
      maxCreationCount: { type: Number, default: 2 },
      creationWindowDays: { type: Number, default: 30 },
      maxPublishedCourses: { type: Number, default: 2 },
      unlimitedCreationMode: { type: Boolean, default: false },
      highCreationCap: { type: Number, default: 0 },
    },
    students: {
      maxStudents: { type: Number, default: 100 },
    },
    revenue: {
      enabled: { type: Boolean, default: false },
      commissionPercent: { type: Number, default: 0 },
      instructorSharePercent: { type: Number, default: 0 },
    },
    storage: {
      videoGB: { type: Number, default: 2 },
      materialGB: { type: Number, default: 1 },
      recordingGB: { type: Number, default: 0 },
      maxVideoFileSizeMB: { type: Number, default: 500 },
      unlimited: { type: Boolean, default: false },
    },
    certificates: {
      enabled: { type: Boolean, default: false },
      qrVerification: { type: Boolean, default: false },
    },
    liveClasses: {
      enabled: { type: Boolean, default: false },
      monthlyLimit: { type: Number, default: 0 },
      maxDurationMinutes: { type: Number, default: 0 },
      recording: { type: Boolean, default: false },
    },
    analytics: {
      basic: { type: Boolean, default: true },
      advanced: { type: Boolean, default: false },
      revenue: { type: Boolean, default: false },
      export: { type: Boolean, default: false },
    },
    marketing: {
      coupons: { type: Boolean, default: false },
      maxActiveCoupons: { type: Number, default: 0 },
      bundles: { type: Boolean, default: false },
      instructorSubscriptions: { type: Boolean, default: false },
      affiliate: { type: Boolean, default: false },
      affiliatePayout: { type: Boolean, default: false },
    },
    support: {
      level: { type: String, enum: ['none', 'email', 'priority', 'dedicated'], default: 'none' },
    },
  },
  { _id: false }
);

const instructorSubscriptionPlanSchema = new Schema<IInstructorSubscriptionPlan>(
  {
    code: {
      type: String,
      uppercase: true,
      trim: true,
      maxlength: 50,
      default: undefined,
    },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    type: { type: String, enum: ['free', 'paid'], required: true, default: 'free' },
    price: { type: Number, required: true, default: 0, min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    durationDays: { type: Number, required: true, default: 30 },
    description: { type: String, default: '', maxlength: 5000 },
    // Legacy flat features — kept populated so existing UI/tests continue working.
    features: {
      freeCoursesLimit: { type: Number, default: 2 },
      unlimitedCourses: { type: Boolean, default: false },
      storageLimitMB: { type: Number, default: 500 },
      advancedAnalytics: { type: Boolean, default: false },
      coupons: { type: Boolean, default: false },
      liveClasses: { type: Boolean, default: false },
      featuredInstructor: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      unlimitedStorage: { type: Boolean, default: false },
      premiumMarketing: { type: Boolean, default: false },
    },
    entitlements: { type: entitlementsSchema },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isDefaultForFree: { type: Boolean, default: false },
    totalSubscribers: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

instructorSubscriptionPlanSchema.index({ code: 1 }, { unique: true, sparse: true });

export const InstructorSubscriptionPlan = mongoose.model<IInstructorSubscriptionPlan>(
  'InstructorSubscriptionPlan',
  instructorSubscriptionPlanSchema
);
