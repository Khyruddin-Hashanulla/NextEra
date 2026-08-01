import type { ReactNode } from 'react';
import { useInstructorSubscription } from '@/hooks/useInstructorSubscription';
import { hasFeature } from '@/lib/subscription';
import UpgradePrompt from './UpgradePrompt';

interface FeatureGateProps {
  feature: 'unlimitedCourses' | 'advancedAnalytics' | 'coupons' | 'liveClasses' | 'featuredInstructor' | 'prioritySupport' | 'unlimitedStorage' | 'premiumMarketing';
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export default function FeatureGate({ feature, children, fallback, showUpgradePrompt = true }: FeatureGateProps) {
  const { data: planInfo, isLoading } = useInstructorSubscription();

  if (isLoading) return null;

  if (!planInfo || !hasFeature(planInfo, feature)) {
    if (fallback) return <>{fallback}</>;
    if (showUpgradePrompt) return <UpgradePrompt feature={feature} />;
    return null;
  }

  return <>{children}</>;
}
