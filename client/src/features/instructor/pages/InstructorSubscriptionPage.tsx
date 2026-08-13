import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { getFeatureLabel } from '@/lib/subscription';
import {
  useInstructorPlans,
  useInstructorSubscriptionOverview,
  useSubscribeToInstructorPlan,
} from '@/hooks/useInstructorSubscription';
import type {
  InstructorPlanLegacyFeatures,
  InstructorSubscriptionOverview,
  InstructorSubscriptionPlan,
} from '@/types/revenue';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Crown,
  HardDrive,
  Layers,
  Minus,
  RefreshCw,
  ShieldCheck,
  Users,
  Video,
} from 'lucide-react';

interface FeatureItem {
  label: string;
  detail?: string;
  enabled: boolean;
}

function billingPeriodLabel(days: number): string {
  if (days === 365) return 'year';
  if (days === 30) return 'month';
  if (days === 7) return 'week';
  if (days === 1) return 'day';
  return `${days} days`;
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || fallback;
}

function buildPlanFeatures(plan: InstructorSubscriptionPlan): FeatureItem[] {
  const e = plan.entitlements;
  if (!e) {
    return Object.entries(plan.features).map(([key, value]) => {
      const enabled = typeof value === 'number' ? value > 0 : value;
      return {
        label: getFeatureLabel(key as keyof InstructorPlanLegacyFeatures),
        detail: typeof value === 'number' ? String(value) : undefined,
        enabled,
      };
    });
  }
  const c = e.courses;
  return [
    {
      label: 'Free course creation',
      detail: c.canCreateFree ? `${c.maxCreationCount}` : undefined,
      enabled: c.canCreateFree,
    },
    { label: 'Paid course creation', enabled: c.canCreatePaid },
    { label: 'Published courses', detail: `${c.maxPublishedCourses}`, enabled: c.maxPublishedCourses > 0 },
    {
      label: 'Live classes / month',
      detail: e.liveClasses.enabled ? `${e.liveClasses.monthlyLimit}` : undefined,
      enabled: e.liveClasses.enabled,
    },
    { label: 'Certificates + QR verification', enabled: e.certificates.enabled },
    {
      label: 'Coupons',
      detail: e.marketing.coupons ? `${e.marketing.maxActiveCoupons}` : undefined,
      enabled: e.marketing.coupons,
    },
    { label: 'Course bundles', enabled: e.marketing.bundles },
    { label: 'Advanced analytics', enabled: e.analytics.advanced },
    {
      label: 'Video storage',
      detail: e.storage.videoGB > 0 ? `${e.storage.videoGB} GB` : undefined,
      enabled: e.storage.videoGB > 0,
    },
    { label: 'Priority support', enabled: e.support.level !== 'none' },
  ];
}

function CurrentPlanCard({
  overview,
  onCancel,
  cancelling,
}: {
  overview: InstructorSubscriptionOverview | null;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const plan = overview?.plan ?? null;
  const subscription = overview?.subscription ?? null;
  const status = overview?.status ?? 'none';
  const usage = overview?.usage ?? null;
  const isActive = status === 'active';
  const isFree = plan?.type === 'free';
  const discounted = Boolean(plan && plan.discountPrice && plan.discountPrice > 0);
  const displayPrice = discounted && plan ? plan.discountPrice! : plan?.price;

  return (
    <Card className={cn('overflow-hidden', isActive ? 'border-success/40' : 'border-warning/40')}>
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Crown className="h-4 w-4 text-primary" aria-hidden="true" />
            Current Plan
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{plan?.name || 'No active plan'}</h2>
            <Badge variant={isActive ? 'success' : 'warning'}>{isActive ? 'Active' : status}</Badge>
          </div>
          {plan?.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
          {plan && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight">
                {plan.type === 'free' ? 'Free' : formatCurrency(displayPrice ?? 0)}
              </span>
              <span className="text-sm text-muted-foreground">/ {billingPeriodLabel(plan.durationDays)}</span>
            </div>
          )}
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/40 p-3">
            <dt className="text-xs text-muted-foreground">Renewal</dt>
            <dd className="mt-1 text-sm font-semibold">
              {subscription?.endDate ? formatDate(subscription.endDate) : '—'}
            </dd>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <dt className="text-xs text-muted-foreground">Started</dt>
            <dd className="mt-1 text-sm font-semibold">
              {subscription?.startDate ? formatDate(subscription.startDate) : '—'}
            </dd>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <dt className="text-xs text-muted-foreground">Auto-renew</dt>
            <dd className="mt-1 text-sm font-semibold">
              {subscription ? (subscription.autoRenew ? 'On' : 'Off') : '—'}
            </dd>
          </div>
        </dl>

        {plan && (
          <div>
            <p className="mb-2 text-sm font-semibold">What's included</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {buildPlanFeatures(plan)
                .filter((f) => f.enabled)
                .map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    <span>{f.label}</span>
                    {f.detail && <span className="text-muted-foreground">({f.detail})</span>}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {usage && (
          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-4 sm:grid-cols-4">
            <div className="text-center">
              <Layers className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-1 text-lg font-semibold">
                {usage.publishedCourses}/{usage.maxPublishedCourses}
              </p>
              <p className="text-xs text-muted-foreground">Published courses</p>
            </div>
            <div className="text-center">
              <Video className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-1 text-lg font-semibold">
                {usage.liveClassesThisMonth}/{usage.maxLiveClasses}
              </p>
              <p className="text-xs text-muted-foreground">Live classes / month</p>
            </div>
            <div className="text-center">
              <Users className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-1 text-lg font-semibold">{usage.maxStudents.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Max students</p>
            </div>
            <div className="text-center">
              <HardDrive className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-1 text-lg font-semibold">{usage.storageLimitGB} GB</p>
              <p className="text-xs text-muted-foreground">Video storage</p>
            </div>
          </div>
        )}

        {!isActive && (
          <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-4 text-sm text-warning">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              {status === 'none'
                ? 'Choose a plan below to start creating and selling courses.'
                : `Your subscription is ${status}. Renew below to keep creating and selling courses.`}
            </p>
          </div>
        )}

        {isActive && !isFree && (
          <div className="flex justify-end border-t pt-5">
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              loading={cancelling}
              onClick={onCancel}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SubscriptionPlanCard({
  plan,
  isCurrent,
  hasActiveSubscription,
  isProcessing,
  processingPlanId,
  onSelect,
}: {
  plan: InstructorSubscriptionPlan;
  isCurrent: boolean;
  hasActiveSubscription: boolean;
  isProcessing: boolean;
  processingPlanId: string | null;
  onSelect: (planId: string) => void;
}) {
  const isLoading = processingPlanId === plan._id;
  const discounted = Boolean(plan.discountPrice && plan.discountPrice > 0);
  const displayPrice = discounted ? plan.discountPrice! : plan.price;
  const features = buildPlanFeatures(plan);

  return (
    <Card
      className={cn(
        'relative flex h-full flex-col transition-shadow hover:shadow-md',
        isCurrent && 'border-primary ring-1 ring-primary/30'
      )}
    >
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
          {isCurrent && <Badge variant="success">Current</Badge>}
        </div>

        {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}

        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight">
              {plan.type === 'free' ? 'Free' : formatCurrency(displayPrice)}
            </span>
            <span className="text-sm text-muted-foreground">/ {billingPeriodLabel(plan.durationDays)}</span>
          </div>
          {discounted && <p className="text-sm text-muted-foreground line-through">{formatCurrency(plan.price)}</p>}
        </div>

        <ul className="flex flex-1 flex-col gap-2.5">
          {features.map((f) => (
            <li key={f.label} className="flex items-start gap-2 text-sm">
              {f.enabled ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />
              )}
              <span className={cn(f.enabled ? 'text-foreground' : 'text-muted-foreground')}>{f.label}</span>
              {f.detail && <span className="ml-auto text-xs text-muted-foreground">{f.detail}</span>}
            </li>
          ))}
        </ul>

        <div className="pt-1">
          {isCurrent ? (
            <Button variant="outline" disabled fullWidth className="cursor-default">
              <Crown className="h-4 w-4 text-success" aria-hidden="true" />
              Current Plan
            </Button>
          ) : (
            <Button fullWidth loading={isLoading} disabled={isProcessing} onClick={() => onSelect(plan._id)}>
              {isLoading ? 'Processing...' : plan.type === 'free' ? 'Choose Starter' : 'Upgrade Plan'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading subscription plans">
      <div className="mx-auto max-w-6xl space-y-8" aria-hidden="true">
        <div className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4 rounded-xl border bg-card p-6">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-28" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SubscriptionErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-6xl">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Could not load subscription plans</h2>
            <p className="text-sm text-muted-foreground">
              Something went wrong while fetching your subscription details. Please try again.
            </p>
          </div>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SubscriptionEmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ShieldCheck className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold">No plans available</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          No subscription plans are currently available. Please check back soon.
        </p>
      </CardContent>
    </Card>
  );
}

export function InstructorSubscriptionPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const {
    data: subscription,
    isLoading: subscriptionLoading,
    isError: subscriptionError,
    refetch: refetchSubscription,
  } = useInstructorSubscriptionOverview();
  const { data: plans, isLoading: plansLoading, isError: plansError, refetch: refetchPlans } = useInstructorPlans();

  const subscribeMutation = useSubscribeToInstructorPlan();

  const cancelMutation = useMutation({
    mutationFn: () => instructorApi.cancelInstructorSubscription(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor', 'subscription'] });
      void queryClient.invalidateQueries({ queryKey: ['instructor', 'subscription', 'overview'] });
      void queryClient.invalidateQueries({ queryKey: ['instructor', 'subscription', 'plans'] });
      void queryClient.invalidateQueries({ queryKey: ['instructor', 'subscription', 'entitlements'] });
      addToast({ title: 'Subscription cancelled', variant: 'success' });
    },
    onError: (err) => addToast({ title: getApiErrorMessage(err, 'Cancel failed'), variant: 'error' }),
  });

  const handlePlanClick = async (planId: string) => {
    if (loadingPlanId) return;
    setLoadingPlanId(planId);
    try {
      const result = await subscribeMutation.mutateAsync({ planId, mode: 'subscribe' });
      if (result.completed) {
        addToast({ title: 'Subscription activated', variant: 'success' });
        return;
      }
      if (!result.orderId || !result.key || result.amount == null || result.currency == null) {
        addToast({ title: 'Payment could not be initiated', variant: 'error' });
        return;
      }
      const opened = await openRazorpayCheckout({
        key: result.key,
        amount: result.amount,
        currency: result.currency,
        orderId: result.orderId,
        name: 'NextEra LMS',
        description: 'Instructor Plan Purchase',
        onSuccess: async (response) => {
          try {
            await subscribeMutation.mutateAsync({
              planId,
              mode: 'verify',
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            addToast({ title: 'Plan activated!', variant: 'success' });
          } catch {
            addToast({ title: 'Payment verification failed', variant: 'error' });
          }
        },
        onDismiss: () => addToast({ title: 'Payment cancelled', variant: 'info' }),
      });
      if (!opened) {
        addToast({ title: 'Failed to load payment gateway', variant: 'error' });
      }
    } catch (err) {
      addToast({ title: getApiErrorMessage(err, 'Could not process plan'), variant: 'error' });
    } finally {
      setLoadingPlanId(null);
    }
  };

  const isLoading = subscriptionLoading || plansLoading;
  const hasError = subscriptionError || plansError;
  const isActive = subscription?.status === 'active';
  const currentPlanId = subscription?.plan?._id ?? null;

  const retry = () => {
    void refetchSubscription();
    void refetchPlans();
  };

  return (
    <div>
      <AdminHeader title="Subscription Plans" description="Choose the plan that best fits your teaching needs." />

      {isLoading ? (
        <SubscriptionSkeleton />
      ) : hasError ? (
        <SubscriptionErrorState onRetry={retry} />
      ) : (
        <div className="mx-auto max-w-6xl space-y-10">
          <CurrentPlanCard
            overview={subscription ?? null}
            onCancel={() => cancelMutation.mutate()}
            cancelling={cancelMutation.isPending}
          />

          <section aria-labelledby="available-plans-heading">
            <div className="mb-5">
              <h2 id="available-plans-heading" className="text-xl font-bold tracking-tight">
                Available Plans
              </h2>
              <p className="text-sm text-muted-foreground">
                Compare plans and choose the one that fits your teaching goals.
              </p>
            </div>

            {plans && plans.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <SubscriptionPlanCard
                    key={plan._id}
                    plan={plan}
                    isCurrent={currentPlanId === plan._id}
                    hasActiveSubscription={isActive}
                    isProcessing={loadingPlanId !== null}
                    processingPlanId={loadingPlanId}
                    onSelect={handlePlanClick}
                  />
                ))}
              </div>
            ) : (
              <SubscriptionEmptyState />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
