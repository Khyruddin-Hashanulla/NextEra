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

export interface InstructorSubscriptionPlan {
  _id: string;
  name: string;
  type: 'free' | 'paid';
  price: number;
  durationDays: number;
  description: string;
  features: {
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
  };
  status: 'active' | 'inactive';
  totalSubscribers: number;
  sortOrder: number;
  createdAt: string;
}

export interface InstructorSubscription {
  _id: string;
  instructor: string;
  plan: InstructorSubscriptionPlan;
  payment?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled' | 'none';
  autoRenew: boolean;
  createdAt: string;
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
