import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/providers/ToastProvider';
import type { InstructorSubscriptionOverview, InstructorSubscriptionPlan } from '@/types/revenue';

const mocks = vi.hoisted(() => ({
  getInstructorPlans: vi.fn(),
  getInstructorSubscriptionOverview: vi.fn(),
  subscribeToInstructorPlan: vi.fn(),
  verifyInstructorSubscription: vi.fn(),
  cancelInstructorSubscription: vi.fn(),
  openRazorpayCheckout: vi.fn(),
}));

vi.mock('@/api/endpoints/instructor', () => ({
  instructorApi: {
    getInstructorPlans: mocks.getInstructorPlans,
    getInstructorSubscriptionOverview: mocks.getInstructorSubscriptionOverview,
    subscribeToInstructorPlan: mocks.subscribeToInstructorPlan,
    verifyInstructorSubscription: mocks.verifyInstructorSubscription,
    cancelInstructorSubscription: mocks.cancelInstructorSubscription,
  },
}));

vi.mock('@/lib/razorpay', () => ({
  openRazorpayCheckout: mocks.openRazorpayCheckout,
}));

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: { name: 'Test Instructor', role: 'instructor' } }),
}));

import { InstructorSubscriptionPage } from './InstructorSubscriptionPage';

const legacyFeatures = {
  freeCoursesLimit: 2,
  unlimitedCourses: false,
  storageLimitMB: 500,
  advancedAnalytics: false,
  coupons: false,
  liveClasses: false,
  featuredInstructor: false,
  prioritySupport: false,
  unlimitedStorage: false,
  premiumMarketing: false,
};

const starterPlan: InstructorSubscriptionPlan = {
  _id: 'plan-starter',
  code: 'STARTER',
  name: 'Starter',
  type: 'free',
  price: 0,
  durationDays: 30,
  description: 'For new instructors',
  features: legacyFeatures,
  status: 'active',
  totalSubscribers: 10,
  sortOrder: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const proPlan: InstructorSubscriptionPlan = {
  _id: 'plan-pro',
  code: 'PRO',
  name: 'Professional',
  type: 'paid',
  price: 999,
  durationDays: 30,
  description: 'For growing instructors',
  features: { ...legacyFeatures, coupons: true, liveClasses: true },
  entitlements: {
    courses: {
      canCreateFree: true,
      canCreatePaid: true,
      maxCreationCount: 10,
      creationWindowDays: 30,
      maxPublishedCourses: 50,
      unlimitedCreationMode: false,
      highCreationCap: 0,
    },
    students: { maxStudents: 1000 },
    revenue: { enabled: true, commissionPercent: 20, instructorSharePercent: 80 },
    storage: { videoGB: 50, materialGB: 10, recordingGB: 5, maxVideoFileSizeMB: 500, unlimited: false },
    certificates: { enabled: true, qrVerification: true },
    liveClasses: { enabled: true, monthlyLimit: 20, maxDurationMinutes: 120, recording: true },
    analytics: { basic: true, advanced: true, revenue: true, export: true },
    marketing: {
      coupons: true,
      maxActiveCoupons: 10,
      bundles: true,
      instructorSubscriptions: true,
      affiliate: false,
      affiliatePayout: false,
    },
    support: { level: 'priority' },
  },
  status: 'active',
  totalSubscribers: 50,
  sortOrder: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const premiumPlan: InstructorSubscriptionPlan = {
  _id: 'plan-premium',
  code: 'PREMIUM',
  name: 'Premium',
  type: 'paid',
  price: 1999,
  durationDays: 365,
  description: 'For established instructors',
  features: { ...legacyFeatures, unlimitedCourses: true, unlimitedStorage: true, advancedAnalytics: true },
  entitlements: {
    courses: {
      canCreateFree: true,
      canCreatePaid: true,
      maxCreationCount: 200,
      creationWindowDays: 30,
      maxPublishedCourses: 200,
      unlimitedCreationMode: true,
      highCreationCap: 200,
    },
    students: { maxStudents: 5000 },
    revenue: { enabled: true, commissionPercent: 5, instructorSharePercent: 95 },
    storage: { videoGB: 200, materialGB: 50, recordingGB: 20, maxVideoFileSizeMB: 1000, unlimited: true },
    certificates: { enabled: true, qrVerification: true },
    liveClasses: { enabled: true, monthlyLimit: 100, maxDurationMinutes: 180, recording: true },
    analytics: { basic: true, advanced: true, revenue: true, export: true },
    marketing: {
      coupons: true,
      maxActiveCoupons: 50,
      bundles: true,
      instructorSubscriptions: true,
      affiliate: true,
      affiliatePayout: true,
    },
    support: { level: 'dedicated' },
  },
  status: 'active',
  totalSubscribers: 20,
  sortOrder: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const activeProOverview: InstructorSubscriptionOverview = {
  subscription: {
    _id: 'sub-1',
    instructor: 'instr-1',
    plan: proPlan,
    startDate: '2026-08-01T12:00:00.000Z',
    endDate: '2026-09-24T12:00:00.000Z',
    status: 'ACTIVE',
    autoRenew: true,
    createdAt: '2026-08-01T12:00:00.000Z',
  },
  plan: proPlan,
  status: 'active',
  planCode: 'PRO',
  entitlements: proPlan.entitlements!,
  usage: {
    publishedCourses: 3,
    maxPublishedCourses: 50,
    liveClassesThisMonth: 1,
    maxLiveClasses: 20,
    activeCoupons: 2,
    maxActiveCoupons: 10,
    maxStudents: 1000,
    storageLimitGB: 50,
    canCreatePaid: true,
  },
};

const noSubscriptionOverview: InstructorSubscriptionOverview = {
  subscription: null,
  plan: null,
  status: 'none',
  planCode: null,
  entitlements: starterPlan.entitlements ?? ({} as InstructorSubscriptionOverview['entitlements']),
  usage: {
    publishedCourses: 0,
    maxPublishedCourses: 2,
    liveClassesThisMonth: 0,
    maxLiveClasses: 0,
    activeCoupons: 0,
    maxActiveCoupons: 0,
    maxStudents: 100,
    storageLimitGB: 2,
    canCreatePaid: false,
  },
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <InstructorSubscriptionPage />
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe('InstructorSubscriptionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getInstructorPlans.mockResolvedValue({ data: { data: [starterPlan, proPlan, premiumPlan] } });
    mocks.getInstructorSubscriptionOverview.mockResolvedValue({ data: { data: activeProOverview } });
    mocks.subscribeToInstructorPlan.mockResolvedValue({
      data: { data: { completed: false, orderId: 'order_1', key: 'rzp_key', amount: 99900, currency: 'INR' } },
    });
    mocks.verifyInstructorSubscription.mockResolvedValue({ data: { data: { success: true } } });
    mocks.cancelInstructorSubscription.mockResolvedValue({ data: { data: { success: true } } });
    mocks.openRazorpayCheckout.mockImplementation(
      (opts: {
        onSuccess: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
      }) => {
        opts.onSuccess({ razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'sig_1' });
        return Promise.resolve(true);
      }
    );
  });

  it('shows a loading skeleton before data arrives', () => {
    mocks.getInstructorPlans.mockReturnValue(new Promise(() => {}));
    mocks.getInstructorSubscriptionOverview.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByRole('status', { name: /loading subscription plans/i })).toBeInTheDocument();
    expect(screen.queryByText('Available Plans')).not.toBeInTheDocument();
  });

  it('renders the current plan, status, renewal date, and all plans', async () => {
    renderPage();

    expect((await screen.findAllByRole('heading', { name: 'Professional' })).length).toBeGreaterThan(0);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText(/Sep 24, 2026/)).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /Available Plans/i })).toBeInTheDocument();
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();

    expect(screen.getAllByRole('button', { name: /Current Plan/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /Upgrade Plan/i }).length).toBeGreaterThan(0);
  });

  it('does not allow re-purchasing the current plan but allows upgrading to other plans', async () => {
    renderPage();
    await screen.findAllByRole('heading', { name: 'Professional' });

    const currentButton = screen.getAllByRole('button', { name: /Current Plan/i })[0];
    expect(currentButton).toBeDisabled();

    const upgradeButtons = screen.getAllByRole('button', { name: /Upgrade Plan/i });
    expect(upgradeButtons.length).toBeGreaterThan(0);
    upgradeButtons.forEach((b) => expect(b).not.toBeDisabled());

    fireEvent.click(currentButton);
    await waitFor(() => {
      expect(mocks.subscribeToInstructorPlan).not.toHaveBeenCalled();
    });
  });

  it('runs the full upgrade flow for a paid plan and prevents duplicate clicks', async () => {
    mocks.getInstructorSubscriptionOverview.mockResolvedValue({ data: { data: noSubscriptionOverview } });

    let resolveSubscribe: (v: unknown) => void;
    mocks.subscribeToInstructorPlan.mockReturnValue(
      new Promise((res) => {
        resolveSubscribe = res;
      })
    );

    renderPage();
    await screen.findByRole('heading', { name: /Available Plans/i });

    const upgradeButton = screen.getAllByRole('button', { name: /Upgrade Plan/i })[0];
    fireEvent.click(upgradeButton);

    expect(await screen.findByRole('button', { name: /Processing\.\.\./i })).toBeDisabled();
    fireEvent.click(screen.getAllByRole('button', { name: /Upgrade Plan/i })[0]);
    expect(mocks.subscribeToInstructorPlan).toHaveBeenCalledTimes(1);
    expect(mocks.subscribeToInstructorPlan).toHaveBeenCalledWith('plan-pro');

    resolveSubscribe!({
      data: { data: { completed: false, orderId: 'order_1', key: 'rzp_key', amount: 99900, currency: 'INR' } },
    });

    await waitFor(() => {
      expect(mocks.openRazorpayCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'rzp_key',
          orderId: 'order_1',
          amount: 99900,
          currency: 'INR',
          name: 'NextEra LMS',
        })
      );
    });
    await waitFor(() => {
      expect(mocks.verifyInstructorSubscription).toHaveBeenCalledWith({
        planId: 'plan-pro',
        razorpayOrderId: 'order_1',
        razorpayPaymentId: 'pay_1',
        razorpaySignature: 'sig_1',
      });
    });

    expect(await screen.findByText('Plan activated!')).toBeInTheDocument();
    await waitFor(() => {
      expect(mocks.getInstructorSubscriptionOverview.mock.calls.length).toBeGreaterThan(1);
    });
  });

  it('activates a free plan directly without opening a checkout', async () => {
    mocks.getInstructorSubscriptionOverview.mockResolvedValue({ data: { data: noSubscriptionOverview } });
    mocks.subscribeToInstructorPlan.mockResolvedValue({ data: { data: { completed: true } } });

    renderPage();
    await screen.findByRole('heading', { name: /Available Plans/i });

    fireEvent.click(screen.getByRole('button', { name: /Choose Starter/i }));

    expect(await screen.findByText('Subscription activated')).toBeInTheDocument();
    expect(mocks.openRazorpayCheckout).not.toHaveBeenCalled();
  });

  it('shows an error state and recovers via retry', async () => {
    mocks.getInstructorPlans
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValue({ data: { data: [starterPlan, proPlan, premiumPlan] } });

    renderPage();

    expect(await screen.findByRole('heading', { name: /Could not load subscription plans/i })).toBeInTheDocument();
    expect(screen.queryByText('Available Plans')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

    expect(await screen.findByRole('heading', { name: /Available Plans/i })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Professional' }).length).toBeGreaterThan(0);
  });

  it('shows an empty state when no plans are returned', async () => {
    mocks.getInstructorPlans.mockResolvedValue({ data: { data: [] } });

    renderPage();

    expect(await screen.findByText('No plans available')).toBeInTheDocument();
    expect(screen.getByText(/No subscription plans are currently available\./i)).toBeInTheDocument();
  });

  it('cancels the subscription and refreshes the subscription state', async () => {
    renderPage();
    await screen.findAllByRole('heading', { name: 'Professional' });

    fireEvent.click(screen.getByRole('button', { name: /Cancel Subscription/i }));

    expect(await screen.findByText('Subscription cancelled')).toBeInTheDocument();
    await waitFor(() => {
      expect(mocks.getInstructorSubscriptionOverview.mock.calls.length).toBeGreaterThan(1);
    });
  });

  it('shows an error toast when payment initiation fails', async () => {
    mocks.getInstructorSubscriptionOverview.mockResolvedValue({ data: { data: noSubscriptionOverview } });
    mocks.subscribeToInstructorPlan.mockResolvedValue({ data: { data: { completed: false } } });

    renderPage();
    await screen.findByRole('heading', { name: /Available Plans/i });

    fireEvent.click(screen.getAllByRole('button', { name: /Upgrade Plan/i })[0]);

    expect(await screen.findByText('Payment could not be initiated')).toBeInTheDocument();
    expect(mocks.openRazorpayCheckout).not.toHaveBeenCalled();
  });
});
