import { useQuery } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import type { PlanInfo } from '@/lib/subscription';

function mapToPlanInfo(data: any): PlanInfo {
  const plan = data?.plan;
  const features = plan?.features || {};

  return {
    status: data?.status || 'none',
    planName: plan?.name,
    endDate: data?.endDate || null,
    features: {
      freeCoursesLimit: features.freeCoursesLimit ?? 2,
      unlimitedCourses: features.unlimitedCourses ?? false,
      storageLimitMB: features.storageLimitMB ?? 500,
      advancedAnalytics: features.advancedAnalytics ?? false,
      coupons: features.coupons ?? false,
      liveClasses: features.liveClasses ?? false,
      featuredInstructor: features.featuredInstructor ?? false,
      prioritySupport: features.prioritySupport ?? false,
      unlimitedStorage: features.unlimitedStorage ?? false,
      premiumMarketing: features.premiumMarketing ?? false,
    },
  };
}

export function useInstructorSubscription() {
  return useQuery<PlanInfo>({
    queryKey: ['instructor', 'subscription'],
    queryFn: async () => {
      const { data } = await instructorApi.getMyInstructorSubscription();
      return mapToPlanInfo(data.data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInstructorSubscriptionStatus() {
  return useQuery<{ status: string; expiry: string | null }>({
    queryKey: ['instructor', 'subscription-status'],
    queryFn: async () => {
      const { data } = await instructorApi.getSubscriptionStatus();
      return {
        status: (data.data as any).subscriptionStatus ?? 'none',
        expiry: (data.data as any).subscriptionExpiry ?? null,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
