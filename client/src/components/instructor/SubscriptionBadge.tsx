import { useInstructorSubscription } from '@/hooks/useInstructorSubscription';

const BADGE_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  expired: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  none: 'bg-gray-50 text-gray-400 border-gray-100',
};

export default function SubscriptionBadge() {
  const { data: planInfo, isLoading } = useInstructorSubscription();

  if (isLoading) return <span className="inline-block h-5 w-20 animate-pulse rounded bg-gray-200" />;

  const status = planInfo?.status || 'none';
  const planName = planInfo?.planName || 'Starter';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${BADGE_STYLES[status] || BADGE_STYLES.none}`}
      title={planInfo?.endDate ? `Expires: ${new Date(planInfo.endDate).toLocaleDateString()}` : undefined}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      {status === 'active' ? planName : `${planName} (${status})`}
    </span>
  );
}
