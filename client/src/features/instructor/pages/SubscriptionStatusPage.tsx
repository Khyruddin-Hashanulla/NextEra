import { useQuery } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsSkeleton } from '@/components/skeletons/FormSkeleton';
import { Crown, Calendar, AlertCircle } from 'lucide-react';

export function SubscriptionStatusPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'subscription'],
    queryFn: ({ signal }) => instructorApi.getSubscriptionStatus(signal).then((r) => r.data.data),
  });

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  const isActive = data?.subscriptionStatus === 'active';

  return (
    <div>
      <AdminHeader title="Subscription Status" description="Your instructor subscription details" />

      <div className="mx-auto max-w-md">
        <Card className={isActive ? 'border-green-200' : 'border-yellow-200'}>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-center">
              {isActive ? (
                <>
                  <Crown className="h-6 w-6 text-yellow-500" />
                  Active Subscription
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-yellow-500" />
                  No Active Subscription
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={`text-lg font-semibold ${isActive ? 'text-green-600' : 'text-yellow-600'}`}>
                {data?.subscriptionStatus || 'inactive'}
              </p>
            </div>
            {data?.subscriptionExpiry && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Expires</p>
                <p className="flex items-center justify-center gap-2 text-lg font-semibold">
                  <Calendar className="h-4 w-4" />
                  {new Date(data.subscriptionExpiry).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
