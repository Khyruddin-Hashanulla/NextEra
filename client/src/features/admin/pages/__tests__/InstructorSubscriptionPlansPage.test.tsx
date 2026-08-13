import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InstructorSubscriptionPlansPage } from '../InstructorSubscriptionPlansPage';
import type { InstructorSubscriptionPlan } from '@/types/revenue';

const { listPlans, getStats, createPlan, updatePlan, addToast } = vi.hoisted(() => ({
  listPlans: vi.fn(),
  getStats: vi.fn(),
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
  addToast: vi.fn(),
}));

vi.mock('@/api/endpoints/admin', () => ({
  adminApi: {
    listInstructorSubscriptionPlans: listPlans,
    getInstructorSubscriptionStats: getStats,
    createInstructorSubscriptionPlan: createPlan,
    updateInstructorSubscriptionPlan: updatePlan,
    deleteInstructorSubscriptionPlan: vi.fn(),
  },
}));

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => ({ addToast }),
}));

const growthPlan: InstructorSubscriptionPlan = {
  _id: 'plan-growth',
  code: 'GROWTH',
  name: 'Growth',
  type: 'paid',
  price: 499,
  discountPrice: 399,
  durationDays: 30,
  description: 'Sell courses',
  status: 'active',
  sortOrder: 2,
  totalSubscribers: 3,
  createdAt: '2026-01-01T00:00:00Z',
  features: {} as any,
  entitlements: {
    courses: {
      canCreateFree: true,
      canCreatePaid: true,
      maxCreationCount: 5,
      creationWindowDays: 30,
      maxPublishedCourses: 5,
      unlimitedCreationMode: false,
      highCreationCap: 0,
    },
    students: { maxStudents: 500 },
    revenue: { enabled: true, commissionPercent: 25, instructorSharePercent: 75 },
    storage: { videoGB: 10, materialGB: 5, recordingGB: 5, maxVideoFileSizeMB: 1024, unlimited: false },
    certificates: { enabled: true, qrVerification: true },
    liveClasses: { enabled: true, monthlyLimit: 4, maxDurationMinutes: 60, recording: true },
    analytics: { basic: true, advanced: false, revenue: false, export: false },
    marketing: {
      coupons: true,
      maxActiveCoupons: 5,
      bundles: false,
      instructorSubscriptions: false,
      affiliate: false,
      affiliatePayout: false,
    },
    support: { level: 'email' },
  },
};

function renderPage(plans: InstructorSubscriptionPlan[] = []) {
  listPlans.mockResolvedValue({ data: { data: plans } });
  getStats.mockResolvedValue({ data: { data: { total: 0, active: 0, byPlan: [], revenue: 0 } } });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <InstructorSubscriptionPlansPage />
    </QueryClientProvider>
  );
  return qc;
}

function openCreateDialog() {
  fireEvent.click(screen.getByRole('button', { name: /Add Plan/ }));
}

function structuredSection() {
  const dialog = screen.getByRole('dialog');
  return within(dialog)
    .getByText(/Structured Entitlements/)
    .closest('div.rounded-lg.border') as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('InstructorSubscriptionPlansPage', () => {
  it('keeps every structured entitlement toggle independent', async () => {
    renderPage();
    openCreateDialog();
    await screen.findByRole('dialog');
    const section = structuredSection();

    const canCreateFree = within(section).getByRole('switch', { name: 'Can create free' });
    const canCreatePaid = within(section).getByRole('switch', { name: 'Can create paid' });
    const unlimitedCreation = within(section).getByRole('switch', { name: 'Unlimited creation' });

    fireEvent.click(canCreateFree);
    expect(canCreatePaid).not.toBeChecked();
    expect(unlimitedCreation).not.toBeChecked();

    fireEvent.click(unlimitedCreation);
    expect(canCreateFree).not.toBeChecked();
    expect(canCreatePaid).not.toBeChecked();

    const certs = within(section).getByRole('switch', { name: 'Certificates' });
    const qr = within(section).getByRole('switch', { name: 'QR verification' });
    fireEvent.click(certs);
    expect(qr).not.toBeChecked();

    const live = within(section).getByRole('switch', { name: 'Live classes' });
    const recording = within(section).getByRole('switch', { name: 'Recording' });
    fireEvent.click(live);
    expect(recording).not.toBeChecked();

    const coupons = within(section).getByRole('switch', { name: 'Coupons' });
    const bundles = within(section).getByRole('switch', { name: 'Bundles' });
    fireEvent.click(coupons);
    expect(bundles).not.toBeChecked();

    const unlimitedStorage = within(section).getByRole('switch', { name: 'Unlimited storage' });
    const videoGb = within(section).getByLabelText('Video storage (GB)') as HTMLInputElement;
    fireEvent.click(unlimitedStorage);
    expect(videoGb.value).toBe('2');
  });

  it('does not derive "Unlimited Courses" from "Can create paid" alone', async () => {
    renderPage();
    openCreateDialog();
    await screen.findByRole('dialog');
    const section = structuredSection();

    const featuresBox = screen.getByText('Features').closest('div.rounded-lg.border') as HTMLElement;
    const unlimitedCoursesRow = within(featuresBox).getByRole('switch', { name: 'Unlimited Courses' });

    expect(unlimitedCoursesRow).toBeDisabled();
    expect(unlimitedCoursesRow).not.toBeChecked();

    fireEvent.click(within(section).getByRole('switch', { name: 'Can create paid' }));
    expect(unlimitedCoursesRow).not.toBeChecked();

    fireEvent.click(within(section).getByRole('switch', { name: 'Unlimited creation' }));
    expect(unlimitedCoursesRow).toBeChecked();

    const creationLimit = within(section).getByLabelText('Creation window limit') as HTMLInputElement;
    fireEvent.change(creationLimit, { target: { value: '5' } });
    expect(unlimitedCoursesRow).toBeChecked();
  });

  it('keeps every numeric input independent', async () => {
    renderPage();
    openCreateDialog();
    await screen.findByRole('dialog');
    const section = structuredSection();

    const price = screen.getByLabelText('Price (₹)') as HTMLInputElement;
    const discount = screen.getByLabelText('Discount Price (₹)') as HTMLInputElement;
    fireEvent.change(price, { target: { value: '999' } });
    expect(discount.value).toBe('0');

    const maxStudents = within(section).getByLabelText('Max students') as HTMLInputElement;
    const videoGb = within(section).getByLabelText('Video storage (GB)') as HTMLInputElement;
    fireEvent.change(maxStudents, { target: { value: '500' } });
    expect(videoGb.value).toBe('2');

    const platformPct = within(section).getByLabelText('Platform %') as HTMLInputElement;
    const instructorPct = within(section).getByLabelText('Instructor %') as HTMLInputElement;
    fireEvent.change(platformPct, { target: { value: '25' } });
    expect(instructorPct.value).toBe('0');
  });

  it('loads every stored value when editing a plan', async () => {
    renderPage([growthPlan]);
    await screen.findByText('Growth');
    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    await screen.findByRole('dialog');
    const section = structuredSection();

    expect(screen.getByLabelText('Name')).toHaveValue('Growth');
    expect(screen.getByLabelText('Price (₹)')).toHaveValue(499);
    expect(screen.getByLabelText('Discount Price (₹)')).toHaveValue(399);

    expect(within(section).getByRole('switch', { name: 'Can create paid' })).toBeChecked();
    expect(within(section).getByRole('switch', { name: 'Commission enabled' })).toBeChecked();
    expect(within(section).getByRole('switch', { name: 'Certificates' })).toBeChecked();
    expect(within(section).getByRole('switch', { name: 'QR verification' })).toBeChecked();
    expect(within(section).getByRole('switch', { name: 'Coupons' })).toBeChecked();

    expect(within(section).getByLabelText('Max students')).toHaveValue(500);
    expect(within(section).getByLabelText('Video storage (GB)')).toHaveValue(10);
    expect(within(section).getByLabelText('Platform %')).toHaveValue(25);
  });

  it('submits a full structured payload on create and persists every field', async () => {
    renderPage();
    openCreateDialog();
    await screen.findByRole('dialog');
    const section = structuredSection();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Growth' } });
    fireEvent.change(screen.getByLabelText('Price (₹)'), { target: { value: '999' } });
    fireEvent.change(screen.getByLabelText('Discount Price (₹)'), { target: { value: '799' } });
    fireEvent.change(screen.getByLabelText('Duration (days)'), { target: { value: '30' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Type' }), { target: { value: 'paid' } });

    fireEvent.click(within(section).getByRole('switch', { name: 'Can create paid' }));
    fireEvent.click(within(section).getByRole('switch', { name: 'Certificates' }));
    fireEvent.click(within(section).getByRole('switch', { name: 'QR verification' }));
    fireEvent.change(within(section).getByLabelText('Creation window limit'), { target: { value: '5' } });
    fireEvent.change(within(section).getByLabelText('Window (days)'), { target: { value: '30' } });
    fireEvent.change(within(section).getByLabelText('Max students'), { target: { value: '500' } });
    fireEvent.change(within(section).getByLabelText('Video storage (GB)'), { target: { value: '20' } });
    fireEvent.change(within(section).getByLabelText('Platform %'), { target: { value: '25' } });
    fireEvent.change(within(section).getByLabelText('Instructor %'), { target: { value: '75' } });

    createPlan.mockResolvedValue({ data: { data: growthPlan } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Plan' }));

    await waitFor(() => expect(createPlan).toHaveBeenCalledTimes(1));
    const payload = createPlan.mock.calls[0][0];

    expect(payload.name).toBe('Test Growth');
    expect(payload.type).toBe('paid');
    expect(payload.price).toBe(999);
    expect(payload.discountPrice).toBe(799);
    expect(payload.durationDays).toBe(30);
    expect(payload.entitlements.courses.canCreateFree).toBe(true);
    expect(payload.entitlements.courses.canCreatePaid).toBe(true);
    expect(payload.entitlements.courses.maxCreationCount).toBe(5);
    expect(payload.entitlements.courses.creationWindowDays).toBe(30);
    expect(payload.entitlements.students.maxStudents).toBe(500);
    expect(payload.entitlements.storage.videoGB).toBe(20);
    expect(payload.entitlements.revenue.commissionPercent).toBe(25);
    expect(payload.entitlements.revenue.instructorSharePercent).toBe(75);
    expect(payload.entitlements.certificates.enabled).toBe(true);
    expect(payload.entitlements.certificates.qrVerification).toBe(true);
    expect(payload.entitlements.support.level).toBe('none');
    // Structured plans never send a redundant/contradictory flat features block.
    expect(payload.features).toBeUndefined();
  });

  it('submits an update that changes one field and preserves every other entitlement', async () => {
    renderPage([growthPlan]);
    await screen.findByText('Growth');
    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    await screen.findByRole('dialog');
    const section = structuredSection();

    fireEvent.change(screen.getByLabelText('Price (₹)'), { target: { value: '1099' } });
    fireEvent.click(within(section).getByRole('switch', { name: 'Can create paid' }));

    updatePlan.mockResolvedValue({ data: { data: growthPlan } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Plan' }));

    await waitFor(() => expect(updatePlan).toHaveBeenCalledTimes(1));
    const [id, payload] = updatePlan.mock.calls[0];
    expect(id).toBe('plan-growth');
    expect(payload.price).toBe(1099);
    expect(payload.entitlements.courses.canCreatePaid).toBe(false);
    expect(payload.entitlements.courses.canCreateFree).toBe(true);
    expect(payload.entitlements.students.maxStudents).toBe(500);
    expect(payload.entitlements.revenue.commissionPercent).toBe(25);
    expect(payload.entitlements.storage.videoGB).toBe(10);
    expect(payload.entitlements.support.level).toBe('email');
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Plan updated' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps legacy flat features independent and submits them without entitlements', async () => {
    const legacyPlan: InstructorSubscriptionPlan = {
      _id: 'plan-legacy',
      code: 'LEGACY',
      name: 'Legacy Basic',
      type: 'free',
      price: 0,
      discountPrice: 0,
      durationDays: 30,
      description: 'Legacy flat features only',
      status: 'active',
      sortOrder: 3,
      totalSubscribers: 0,
      createdAt: '2026-01-01T00:00:00Z',
      features: {
        freeCoursesLimit: 1,
        unlimitedCourses: false,
        storageLimitMB: 200,
        advancedAnalytics: false,
        coupons: false,
        liveClasses: false,
        featuredInstructor: false,
        prioritySupport: false,
        unlimitedStorage: false,
        premiumMarketing: false,
      },
    };
    renderPage([legacyPlan]);
    await screen.findByText('Legacy Basic');
    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    await screen.findByRole('dialog');

    const section = screen.getByText('Features').closest('div.rounded-lg.border') as HTMLElement;
    const coupons = within(section).getByRole('switch', { name: 'Coupons' });
    const unlimited = within(section).getByRole('switch', { name: 'Unlimited Courses' });
    const liveClasses = within(section).getByRole('switch', { name: 'Live Classes' });

    expect(coupons).not.toBeDisabled();
    fireEvent.click(coupons);
    expect(unlimited).not.toBeChecked();
    expect(liveClasses).not.toBeChecked();

    fireEvent.click(liveClasses);
    expect(coupons).toBeChecked();
    expect(unlimited).not.toBeChecked();

    const freeLimit = within(section).getByLabelText('Free Course Limit') as HTMLInputElement;
    const storageMb = within(section).getByLabelText('Storage (MB)') as HTMLInputElement;
    fireEvent.change(freeLimit, { target: { value: '5' } });
    expect(storageMb.value).toBe('200');

    updatePlan.mockResolvedValue({ data: { data: legacyPlan } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Plan' }));

    await waitFor(() => expect(updatePlan).toHaveBeenCalledTimes(1));
    const [id, payload] = updatePlan.mock.calls[0];
    expect(id).toBe('plan-legacy');
    expect(payload.features.coupons).toBe(true);
    expect(payload.features.liveClasses).toBe(true);
    expect(payload.features.freeCoursesLimit).toBe(5);
    expect(payload.features.storageLimitMB).toBe(200);
    expect(payload.entitlements).toBeUndefined();
  });
});
