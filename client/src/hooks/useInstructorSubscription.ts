import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import type { PlanInfo } from '@/lib/subscription';
import type {
  InstructorEntitlementView,
  InstructorSubscriptionInitResult,
  InstructorSubscriptionOverview,
  InstructorSubscriptionPlan,
} from '@/types/revenue';

function mapToPlanInfo(data: any): PlanInfo {
  const plan = data?.plan;
  const features = plan?.features || {};

  const rawStatus = String(data?.status || 'none').toLowerCase();
  const status: PlanInfo['status'] =
    rawStatus === 'active' || rawStatus === 'expired' || rawStatus === 'cancelled' ? rawStatus : 'none';

  return {
    status,
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

export function useInstructorPlans() {
  return useQuery<InstructorSubscriptionPlan[]>({
    queryKey: ['instructor', 'subscription', 'plans'],
    queryFn: async () => {
      const { data } = await instructorApi.getInstructorPlans();
      return data.data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useInstructorSubscriptionOverview() {
  return useQuery<InstructorSubscriptionOverview | null>({
    queryKey: ['instructor', 'subscription', 'overview'],
    queryFn: async () => {
      const { data } = await instructorApi.getInstructorSubscriptionOverview();
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useInstructorEntitlements() {
  return useQuery<InstructorEntitlementView | null>({
    queryKey: ['instructor', 'subscription', 'entitlements'],
    queryFn: async () => {
      const { data } = await instructorApi.getInstructorEntitlements();
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useSubscribeToInstructorPlan() {
  const queryClient = useQueryClient();
  return useMutation<
    InstructorSubscriptionInitResult,
    Error,
    {
      planId: string;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
      mode?: 'subscribe' | 'renew' | 'verify';
    }
  >({
    mutationFn: async (vars) => {
      if (vars.mode === 'verify') {
        const { data: _data } = await instructorApi.verifyInstructorSubscription({
          planId: vars.planId,
          razorpayOrderId: vars.razorpayOrderId!,
          razorpayPaymentId: vars.razorpayPaymentId!,
          razorpaySignature: vars.razorpaySignature!,
        });
        return { completed: true } as InstructorSubscriptionInitResult;
      }
      if (vars.mode === 'renew') {
        const { data } = await instructorApi.renewInstructorPlan(vars.planId);
        return data.data;
      }
      const { data } = await instructorApi.subscribeToInstructorPlan(vars.planId);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor', 'subscription'] });
      void queryClient.invalidateQueries({ queryKey: ['instructor', 'subscription', 'overview'] });
      void queryClient.invalidateQueries({ queryKey: ['instructor', 'subscription', 'entitlements'] });
    },
  });
}
