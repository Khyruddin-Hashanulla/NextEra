export interface RevenueDashboardData {
  wallet: {
    totalRevenue: number;
    totalCommissionCollected: number;
    totalPayoutsMade: number;
    currentBalance: number;
    pendingPayouts: number;
  };
  dailyRevenue: { _id: string; amount: number; count: number }[];
  revenueBySource: { _id: string; amount: number; count: number; commission: number }[];
  monthlyTrend: { _id: string; amount: number; commission: number; instructorShare: number }[];
  activeInstructorSubscriptions: number;
  activePromotions: number;
  topInstructors: { _id: string; name: string; email: string; avatar?: { url: string }; totalPaid: number }[];
  instructorSubscriptionRevenue: number;
  featuredPromotionRevenue: number;
}

export interface InstructorPlanEntitlements {
  courses: {
    canCreateFree: boolean;
    canCreatePaid: boolean;
    maxCreationCount: number;
    creationWindowDays: number;
    maxPublishedCourses: number;
    unlimitedCreationMode: boolean;
    highCreationCap: number;
  };
  students: { maxStudents: number };
  revenue: { enabled: boolean; commissionPercent: number; instructorSharePercent: number };
  storage: {
    videoGB: number;
    materialGB: number;
    recordingGB: number;
    maxVideoFileSizeMB: number;
    unlimited?: boolean;
  };
  certificates: { enabled: boolean; qrVerification: boolean };
  liveClasses: { enabled: boolean; monthlyLimit: number; maxDurationMinutes: number; recording: boolean };
  analytics: { basic: boolean; advanced: boolean; revenue: boolean; export: boolean };
  marketing: {
    coupons: boolean;
    maxActiveCoupons: number;
    bundles: boolean;
    instructorSubscriptions: boolean;
    affiliate: boolean;
    affiliatePayout: boolean;
  };
  support: { level: 'none' | 'email' | 'priority' | 'dedicated' };
}

export interface InstructorPlanLegacyFeatures {
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

export interface InstructorSubscriptionPlan {
  _id: string;
  code?: string;
  name: string;
  type: 'free' | 'paid';
  price: number;
  discountPrice?: number;
  durationDays: number;
  description: string;
  features: InstructorPlanLegacyFeatures;
  entitlements?: InstructorPlanEntitlements;
  status: 'active' | 'inactive';
  isDefaultForFree?: boolean;
  totalSubscribers: number;
  sortOrder: number;
  createdAt: string;
}

export interface InstructorSubscription {
  _id: string;
  instructor: string;
  plan: InstructorSubscriptionPlan;
  planSnapshot?: { code?: string; name: string; price: number; durationDays: number };
  payment?: string;
  paymentReference?: string;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  startDate: string;
  endDate: string;
  status:
    | 'active'
    | 'ACTIVE'
    | 'expired'
    | 'EXPIRED'
    | 'cancelled'
    | 'CANCELLED'
    | 'none'
    | 'trial'
    | 'past_due'
    | 'suspended';
  autoRenew: boolean;
  cancelledAt?: string;
  createdAt: string;
}

export interface InstructorSubscriptionOverview {
  subscription: InstructorSubscription | null;
  plan: InstructorSubscriptionPlan | null;
  status: 'active' | 'expired' | 'none';
  planCode: string | null;
  entitlements: InstructorPlanEntitlements;
  usage: {
    publishedCourses: number;
    maxPublishedCourses: number;
    liveClassesThisMonth: number;
    maxLiveClasses: number;
    activeCoupons: number;
    maxActiveCoupons: number;
    maxStudents: number;
    storageLimitGB: number;
    canCreatePaid: boolean;
  };
}

export interface InstructorEntitlementView {
  status: 'active' | 'trial' | 'pastDue' | 'cancelled' | 'expired' | 'suspended' | 'none';
  planCode?: string;
  planName?: string;
  endDate?: string | null;
  startDate?: string | null;
  autoRenew: boolean;
  entitlements: InstructorPlanEntitlements;
}

export interface InstructorSubscriptionInitResult {
  completed: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  key?: string;
  paymentId?: string;
  subscription?: InstructorSubscription;
  plan?: {
    _id: string;
    code?: string;
    name: string;
    price: number;
    durationDays: number;
  };
}

export interface AffiliateItem {
  _id: string;
  user: { _id: string; name: string; email: string; avatar?: { url: string } };
  code: string;
  commissionPercent: number;
  totalEarnings: number;
  totalClicks: number;
  totalConversions: number;
  status: 'active' | 'inactive';
  payoutMethod: string;
  payoutDetails: {
    bankAccount?: string;
    bankIfsc?: string;
    paypalEmail?: string;
    upiId?: string;
  };
  createdAt: string;
}

export interface AffiliateStats {
  total: number;
  active: number;
  totalEarnings: number;
  totalClicks: number;
  totalConversions: number;
}

export interface FeaturedPromotionItem {
  _id: string;
  type: 'course' | 'instructor';
  course?: { _id: string; title: string; thumbnail?: { url: string } };
  instructor?: { _id: string; name: string; email: string; avatar?: { url: string } };
  startDate: string;
  endDate: string;
  price: number;
  payment?: { _id: string; amount: number };
  status: 'active' | 'expired' | 'cancelled';
  position: number;
  notes?: string;
  createdAt: string;
}

export interface FeaturedPromotionStats {
  total: number;
  active: number;
  expired: number;
  revenue: number;
}

export interface InstructorSubscriptionStats {
  total: number;
  active: number;
  byPlan: { _id: string; plan: { name: string }; count: number }[];
  revenue: number;
}

export interface RevenueSummary {
  totalRevenue: number;
  totalTransactions: number;
  totalCommissions: number;
  totalPayouts: number;
  instructorSubscriptionRevenue: number;
  featuredPromotionRevenue: number;
}

export interface InstructorRevenueDetail {
  totalEarned: number;
  pendingPayouts: number;
  recentPayouts: any[];
  courseEarnings: { _id: string; courseTitle: string; totalSales: number; instructorShare: number; count: number }[];
  subscription: any;
}
