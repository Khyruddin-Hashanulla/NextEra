import { useInstructorSubscription } from '@/hooks/useInstructorSubscription';
import { getFeatureLabel, getUpgradePlanForFeature } from '@/lib/subscription';

interface UpgradePromptProps {
  feature:
    | 'unlimitedCourses'
    | 'advancedAnalytics'
    | 'coupons'
    | 'liveClasses'
    | 'featuredInstructor'
    | 'prioritySupport'
    | 'unlimitedStorage'
    | 'premiumMarketing';
  compact?: boolean;
}

export default function UpgradePrompt({ feature, compact = false }: UpgradePromptProps) {
  const { data: planInfo } = useInstructorSubscription();
  const upgradePlan = getUpgradePlanForFeature(feature);
  const featureLabel = getFeatureLabel(feature);

  if (compact) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
        <p className="text-sm text-amber-800">
          <span className="font-medium">{featureLabel}</span> is available on the{' '}
          <span className="font-semibold capitalize">{upgradePlan}</span> plan.
        </p>
        <a
          href="/instructor/subscription"
          className="mt-2 inline-block text-sm font-medium text-amber-600 underline hover:text-amber-700"
        >
          Upgrade now
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-amber-900">Upgrade to Access {featureLabel}</h3>
        <p className="mt-1 text-sm text-amber-700">
          {planInfo?.planName ? (
            <>
              Your current <span className="font-medium capitalize">{planInfo.planName}</span> plan does not include{' '}
              {featureLabel}.
            </>
          ) : (
            <>You need an active subscription to use {featureLabel}.</>
          )}
        </p>
        <p className="mt-1 text-sm text-amber-600">
          Upgrade to <span className="font-semibold capitalize">{upgradePlan}</span> to unlock this feature and more.
        </p>
        <a
          href="/instructor/subscription"
          className="mt-4 inline-flex items-center rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white shadow transition hover:bg-amber-700"
        >
          View Plans
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </div>
  );
}
