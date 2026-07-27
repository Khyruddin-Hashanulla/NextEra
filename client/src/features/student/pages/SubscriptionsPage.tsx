import { useQuery, useMutation } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Crown, Clock, CalendarDays } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useState } from 'react';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function SubscriptionsPage() {
  const { addToast } = useToast();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => studentApi.listSubscriptionPlans().then((r) => r.data.data),
  });

  const { data: mySub, refetch: refetchSub } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => studentApi.getMySubscription().then((r) => r.data.data),
  });

  const initiateMutation = useMutation({
    mutationFn: (subscriptionId: string) => studentApi.initiateSubscriptionPayment(subscriptionId),
    onSuccess: async (res) => {
      const data = res.data.data;
      if (data.free) {
        addToast({ title: 'Free subscription activated!', variant: 'success' });
        refetchSub();
        return;
      }
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        addToast({ title: 'Failed to load payment gateway', variant: 'error' });
        return;
      }
      const rzp = new (window as any).Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'NextEra LMS',
        description: 'Subscription Purchase',
        order_id: data.orderId,
        handler: async (response: any) => {
          try {
            await studentApi.verifySubscriptionPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            addToast({ title: 'Subscription activated!', variant: 'success' });
            refetchSub();
          } catch {
            addToast({ title: 'Payment verification failed', variant: 'error' });
          }
        },
        modal: { ondismiss: () => setLoadingPlanId(null) },
      });
      rzp.open();
    },
    onSettled: () => setLoadingPlanId(null),
  });

  const handleSubscribe = (planId: string) => {
    setLoadingPlanId(planId);
    initiateMutation.mutate(planId);
  };

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSubscribed = mySub?.status === 'active';
  const daysLeft = mySub
    ? Math.max(0, Math.ceil((new Date(mySub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <p className="text-muted-foreground">Choose a plan that fits your learning needs</p>
      </div>

      {isSubscribed && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <Crown className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">You have an active {mySub.subscription?.name} subscription</p>
              <p className="text-sm text-muted-foreground">
                {daysLeft > 0 ? `${daysLeft} days remaining (ends ${new Date(mySub.endDate).toLocaleDateString()})` : 'Expires today'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan: any) => {
          const displayPrice = plan.discountedPrice > 0 ? plan.discountedPrice : plan.price;
          const originalPrice = plan.discountedPrice > 0 ? plan.price : null;
          const isCurrentPlan = isSubscribed && mySub.subscription?._id === plan._id;

          return (
            <Card key={plan._id} className={`flex flex-col ${isCurrentPlan ? 'border-primary ring-1 ring-primary' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.level === 'premium' && <Badge>Popular</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div>
                  {originalPrice ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">${displayPrice}</span>
                      <span className="text-muted-foreground line-through">${originalPrice}</span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold">${displayPrice}</span>
                  )}
                  <p className="text-sm text-muted-foreground">per {plan.durationDays} days</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" /> {plan.durationDays}-day access
                </div>

                <ul className="space-y-2">
                  {plan.features?.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrentPlan ? (
                  <Button className="w-full" disabled>Current Plan</Button>
                ) : isSubscribed ? (
                  <Button className="w-full" variant="outline" disabled>Already Subscribed</Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(plan._id)}
                    disabled={loadingPlanId === plan._id}
                  >
                    {loadingPlanId === plan._id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : plan.price === 0 ? (
                      'Get Started Free'
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
