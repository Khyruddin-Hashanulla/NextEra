import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/providers/ToastProvider';
import { Loader2, Crown, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function InstructorSubscriptionPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['instructor-my-subscription'],
    queryFn: () => instructorApi.getMyInstructorSubscription().then((r) => r.data.data),
  });

  const { data: plansData } = useQuery({
    queryKey: ['instructor-plans-list'],
    queryFn: () => instructorApi.getMyInstructorSubscription().then(() => {
      // Plans info comes from admin, but instructors need a way to see available plans
      return null;
    }),
    enabled: false,
  });

  const cancelMutation = useMutation({
    mutationFn: () => instructorApi.cancelInstructorSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-my-subscription'] });
      addToast({ title: 'Subscription cancelled', variant: 'success' });
    },
    onError: () => addToast({ title: 'Cancel failed', variant: 'error' }),
  });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!subscription) {
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">No subscription info available</p></div>;
  }

  const plan = subscription.plan as any;
  const isActive = subscription.status === 'active';
  const isFree = plan?.type === 'free';

  return (
    <div>
      <AdminHeader title="My Subscription" description="Your instructor platform subscription" />

      <div className="mx-auto max-w-2xl space-y-6">
        <Card className={isActive ? 'border-green-200' : 'border-yellow-200'}>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-center text-xl">
              <Crown className={`h-6 w-6 ${isActive ? (isFree ? 'text-blue-500' : 'text-yellow-500') : 'text-gray-400'}`} />
              {plan?.name || 'Starter'} Plan
              {isActive ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-600">{subscription.status}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {isFree ? 'Free' : `₹${plan?.price || 0}`}
                <span className="text-sm font-normal text-muted-foreground">/{plan?.durationDays || 30}d</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">{plan?.description}</p>
            </div>

            {subscription.startDate && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Started {new Date(subscription.startDate).toLocaleDateString()}
                {subscription.endDate && ` · Ends ${new Date(subscription.endDate).toLocaleDateString()}`}
              </div>
            )}

            {plan?.features && (
              <div className="rounded-lg border p-4">
                <h3 className="mb-3 text-sm font-semibold">Plan Features</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(plan.features).map(([key, val]: [string, any]) => {
                    const labels: Record<string, string> = {
                      freeCoursesLimit: 'Free Course Limit', unlimitedCourses: 'Unlimited Courses',
                      storageLimitMB: 'Storage', advancedAnalytics: 'Advanced Analytics',
                      coupons: 'Coupons', liveClasses: 'Live Classes',
                      featuredInstructor: 'Featured Instructor', prioritySupport: 'Priority Support',
                      unlimitedStorage: 'Unlimited Storage', premiumMarketing: 'Premium Marketing',
                    };
                    const label = labels[key] || key;
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {typeof val === 'boolean' ? (
                          val ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-300" />
                        ) : (
                          <span className="text-blue-500">→</span>
                        )}
                        <span>{label}{typeof val === 'number' ? `: ${val}` : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isActive && !isFree && (
              <div className="flex justify-center">
                <Button variant="outline" className="text-red-600" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                </Button>
              </div>
            )}

            {!isActive && (
              <div className="rounded-lg bg-yellow-50 p-4 text-center text-sm text-yellow-700">
                <AlertCircle className="mx-auto h-5 w-5 mb-1" />
                Your subscription is {subscription.status}. Some features may be limited.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
