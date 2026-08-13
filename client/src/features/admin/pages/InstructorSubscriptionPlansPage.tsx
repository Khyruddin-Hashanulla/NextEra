import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Control, FieldPath } from 'react-hook-form';
import { adminApi } from '@/api/endpoints/admin';
import { InstructorSubscriptionPlan, InstructorPlanEntitlements, InstructorPlanLegacyFeatures } from '@/types/revenue';
import { instructorPlanFormSchema, type InstructorPlanFormValues } from '@/lib/validators/instructorPlanSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/providers/ToastProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Edit3, Trash2, Crown } from 'lucide-react';
import { CardGridSkeleton } from '@/components/skeletons/ListSkeleton';

const defaultFeatures: InstructorPlanLegacyFeatures = {
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

const defaultEntitlements: InstructorPlanEntitlements = {
  courses: {
    canCreateFree: true,
    canCreatePaid: false,
    maxCreationCount: 2,
    creationWindowDays: 30,
    maxPublishedCourses: 2,
    unlimitedCreationMode: false,
    highCreationCap: 0,
  },
  students: { maxStudents: 100 },
  revenue: { enabled: false, commissionPercent: 0, instructorSharePercent: 0 },
  storage: { videoGB: 2, materialGB: 1, recordingGB: 0, maxVideoFileSizeMB: 500, unlimited: false },
  certificates: { enabled: false, qrVerification: false },
  liveClasses: { enabled: false, monthlyLimit: 0, maxDurationMinutes: 0, recording: false },
  analytics: { basic: true, advanced: false, revenue: false, export: false },
  marketing: {
    coupons: false,
    maxActiveCoupons: 0,
    bundles: false,
    instructorSubscriptions: false,
    affiliate: false,
    affiliatePayout: false,
  },
  support: { level: 'none' },
};

const featureLabels: Record<string, string> = {
  freeCoursesLimit: 'Free Course Limit',
  unlimitedCourses: 'Unlimited Courses',
  storageLimitMB: 'Storage (MB)',
  advancedAnalytics: 'Advanced Analytics',
  coupons: 'Coupons',
  liveClasses: 'Live Classes',
  featuredInstructor: 'Featured Instructor',
  prioritySupport: 'Priority Support',
  unlimitedStorage: 'Unlimited Storage',
  premiumMarketing: 'Premium Marketing',
};

function cloneEntitlements(src: InstructorPlanEntitlements): InstructorPlanEntitlements {
  return JSON.parse(JSON.stringify(src)) as InstructorPlanEntitlements;
}

/**
 * Mirror of `deriveLegacyFeaturesFromEntitlements` on the server. Used ONLY for
 * display in the read-only "Features" section. The structured entitlements block
 * is the authoritative source of truth; these derived values never write back.
 */
function deriveFeaturesFromEntitlements(ent: InstructorPlanEntitlements): InstructorPlanLegacyFeatures {
  const c = ent.courses;
  const cap = c.unlimitedCreationMode ? c.highCreationCap || c.maxCreationCount || 200 : c.maxCreationCount;
  const isTopTier = ent.support.level === 'dedicated';
  return {
    freeCoursesLimit: cap,
    unlimitedCourses: c.unlimitedCreationMode,
    storageLimitMB: Math.max(1, Math.round(ent.storage.videoGB * 1024)),
    advancedAnalytics: ent.analytics.advanced,
    coupons: ent.marketing.coupons,
    liveClasses: ent.liveClasses.enabled,
    featuredInstructor: isTopTier,
    prioritySupport: ent.support.level === 'priority' || isTopTier,
    unlimitedStorage: Boolean(ent.storage.unlimited) || c.unlimitedCreationMode,
    premiumMarketing: isTopTier,
  };
}

/**
 * Merge a plan's stored entitlements over the defaults so every leaf the form
 * renders has a concrete value. Keeps zero/false and any advanced entitlement
 * that has no dedicated input (e.g. analytics.basic, marketing.affiliatePayout).
 */
function normalizeEntitlements(src?: InstructorPlanEntitlements): InstructorPlanEntitlements {
  const s = src ?? ({} as Partial<InstructorPlanEntitlements>);
  return {
    courses: { ...defaultEntitlements.courses, ...(s.courses ?? {}) },
    students: { ...defaultEntitlements.students, ...(s.students ?? {}) },
    revenue: { ...defaultEntitlements.revenue, ...(s.revenue ?? {}) },
    storage: { ...defaultEntitlements.storage, ...(s.storage ?? {}) },
    certificates: { ...defaultEntitlements.certificates, ...(s.certificates ?? {}) },
    liveClasses: { ...defaultEntitlements.liveClasses, ...(s.liveClasses ?? {}) },
    analytics: { ...defaultEntitlements.analytics, ...(s.analytics ?? {}) },
    marketing: { ...defaultEntitlements.marketing, ...(s.marketing ?? {}) },
    support: { ...defaultEntitlements.support, ...(s.support ?? {}) },
  };
}

function createDefaultFormValues(): InstructorPlanFormValues {
  return {
    name: '',
    code: '',
    type: 'free',
    price: 0,
    discountPrice: 0,
    durationDays: 30,
    description: '',
    sortOrder: 0,
    status: 'active',
    entitlements: cloneEntitlements(defaultEntitlements),
  };
}

function getApiErrorMessage(err: any, fallback: string): string {
  return err?.response?.data?.message || err?.message || fallback;
}

// ─── Small field helpers ──────────────────────────────────────────────────────
function EntSwitch({
  control,
  name,
  label,
}: {
  control: Control<InstructorPlanFormValues>;
  name: FieldPath<InstructorPlanFormValues>;
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center gap-2">
          <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} aria-label={label} />
          <Label className="text-sm">{label}</Label>
        </div>
      )}
    />
  );
}

function EntNumber({
  control,
  name,
  label,
}: {
  control: Control<InstructorPlanFormValues>;
  name: FieldPath<InstructorPlanFormValues>;
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Input
          type="number"
          min={0}
          label={label}
          value={typeof field.value === 'number' && !Number.isNaN(field.value) ? field.value : ''}
          error={fieldState.error?.message}
          onChange={(e) => field.onChange(e.target.value === '' ? NaN : Number(e.target.value))}
        />
      )}
    />
  );
}

function DisplayFeatureRow({ label, on, value }: { label: string; on: boolean; value?: number | string }) {
  return (
    <div className="flex items-center gap-2">
      <Switch checked={on} disabled aria-label={label} />
      <Label className="text-sm">
        {label}
        {typeof value === 'number' ? ` (${value})` : ''}
      </Label>
    </div>
  );
}

export function InstructorSubscriptionPlansPage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InstructorSubscriptionPlan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<InstructorPlanFormValues>({
    resolver: zodResolver(instructorPlanFormSchema),
    defaultValues: createDefaultFormValues(),
    mode: 'onBlur',
  });
  const { register, control, reset, handleSubmit } = form;

  const watchedEntitlements = useWatch({ control, name: 'entitlements' });
  const isStructured = Boolean(watchedEntitlements);
  const derivedFeatures = useMemo(
    () => (watchedEntitlements ? deriveFeaturesFromEntitlements(watchedEntitlements) : undefined),
    [watchedEntitlements]
  );

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-instructor-plans'],
    queryFn: ({ signal }) => adminApi.listInstructorSubscriptionPlans(signal).then((r) => r.data.data),
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin-instructor-plan-stats'],
    queryFn: ({ signal }) => adminApi.getInstructorSubscriptionStats(signal).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => adminApi.createInstructorSubscriptionPlan(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-plans'] });
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-plan-stats'] });
      addToast({ title: 'Plan created', variant: 'success' });
      setDialogOpen(false);
      setEditing(null);
      reset(createDefaultFormValues());
    },
    onError: (err: any) => addToast({ title: getApiErrorMessage(err, 'Failed to create plan'), variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: any }) => adminApi.updateInstructorSubscriptionPlan(id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-plans'] });
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-plan-stats'] });
      addToast({ title: 'Plan updated', variant: 'success' });
      setDialogOpen(false);
      setEditing(null);
      reset(createDefaultFormValues());
    },
    onError: (err: any) => addToast({ title: getApiErrorMessage(err, 'Failed to update plan'), variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteInstructorSubscriptionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-plans'] });
      queryClient.invalidateQueries({ queryKey: ['admin-instructor-plan-stats'] });
      addToast({ title: 'Plan deleted', variant: 'success' });
      setDeleteId(null);
    },
    onError: (err: any) => addToast({ title: getApiErrorMessage(err, 'Failed to delete plan'), variant: 'error' }),
  });

  const openCreate = () => {
    setEditing(null);
    reset(createDefaultFormValues());
    setDialogOpen(true);
  };

  const openEdit = (p: InstructorSubscriptionPlan) => {
    setEditing(p);
    reset({
      name: p.name,
      code: p.code ?? '',
      type: p.type,
      price: p.price,
      discountPrice: p.discountPrice ?? 0,
      durationDays: p.durationDays,
      description: p.description ?? '',
      sortOrder: p.sortOrder,
      status: p.status,
      entitlements: p.entitlements ? normalizeEntitlements(p.entitlements) : undefined,
      features: p.entitlements ? undefined : { ...defaultFeatures, ...(p.features ?? {}) },
    });
    setDialogOpen(true);
  };

  const buildPayload = (values: InstructorPlanFormValues): any => {
    const isFree = values.type === 'free';
    const payload: any = {
      name: values.name.trim(),
      code: values.code.trim() || undefined,
      type: values.type,
      price: isFree ? 0 : values.price,
      discountPrice: isFree ? 0 : values.discountPrice,
      durationDays: values.durationDays,
      description: values.description ?? '',
      sortOrder: values.sortOrder,
      status: values.status,
    };
    // Structured entitlements are the source of truth. When present, the backend
    // re-derives the legacy flat `features` from them on every save, so we never
    // send a redundant (and potentially contradictory) features object. Legacy
    // plans without entitlements keep sending their own flat features.
    if (values.entitlements) {
      payload.entitlements = values.entitlements;
    } else if (values.features) {
      payload.features = values.features;
    }
    return payload;
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: InstructorPlanFormValues) => {
    if (isSaving) return;
    const payload = buildPayload(values);
    if (editing) updateMutation.mutate({ id: editing._id, d: payload });
    else createMutation.mutate(payload);
  };

  const onInvalid = () => {
    addToast({ title: 'Please fix the highlighted fields', variant: 'error' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instructor Subscription Plans</h1>
          <p className="text-muted-foreground">Manage instructor platform subscription plans (Starter, Pro, Premium)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Add Plan
        </Button>
      </div>

      {statsData && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{statsData.total}</p>
              <p className="text-xs text-muted-foreground">Total Subscriptions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-green-600">{statsData.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">₹{(statsData.revenue || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <CardGridSkeleton cards={6} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(plans || []).map((plan: InstructorSubscriptionPlan) => (
            <Card
              key={plan._id}
              className={plan.type === 'free' ? 'border-blue-200' : plan.name === 'Premium' ? 'border-yellow-200' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className={`h-4 w-4 ${plan.type === 'paid' ? 'text-yellow-500' : 'text-blue-400'}`} />
                      {plan.name}
                      {plan.code && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {plan.code}
                        </span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">
                      {plan.type} · {plan.durationDays} days
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {plan.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-1">
                  {plan.type === 'free' ? 'Free' : `₹${plan.price}`}{' '}
                  <span className="text-sm font-normal text-muted-foreground">/{plan.durationDays}d</span>
                </p>
                <p className="text-xs text-muted-foreground mb-3">{plan.totalSubscribers} subscribers</p>
                {plan.entitlements && (
                  <div className="mb-3 flex flex-wrap gap-1.5 text-[10px] font-medium">
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">
                      {(plan.entitlements.courses as any)?.canCreatePaid ? 'Paid courses' : 'Free courses'}:{' '}
                      {(plan.entitlements.courses as any)?.maxCreationCount}/
                      {(plan.entitlements.courses as any)?.creationWindowDays}d
                    </span>
                    <span className="rounded bg-green-50 px-1.5 py-0.5 text-green-700">
                      {(plan.entitlements.students as any)?.maxStudents} students
                    </span>
                    <span className="rounded bg-purple-50 px-1.5 py-0.5 text-purple-700">
                      {(plan.entitlements.revenue as any)?.enabled
                        ? `${(plan.entitlements.revenue as any)?.commissionPercent}% commission`
                        : 'No commission'}
                    </span>
                    <span className="rounded bg-gray-50 px-1.5 py-0.5 text-gray-700">
                      {(plan.entitlements.storage as any)?.videoGB}GB video
                    </span>
                    <span className="rounded bg-yellow-50 px-1.5 py-0.5 text-yellow-700">
                      {(plan.entitlements.liveClasses as any)?.enabled
                        ? `${(plan.entitlements.liveClasses as any)?.monthlyLimit} live/mo`
                        : 'No live classes'}
                    </span>
                  </div>
                )}
                <ul className="space-y-1 mb-4">
                  {Object.entries(plan.features).map(([key, val]) => {
                    const label = featureLabels[key] || key;
                    if (typeof val === 'boolean') {
                      return (
                        <li key={key} className="text-xs flex items-start gap-2">
                          <span className={val ? 'text-green-500' : 'text-red-400'}>{val ? '✓' : '✗'}</span> {label}
                        </li>
                      );
                    }
                    return (
                      <li key={key} className="text-xs flex items-start gap-2">
                        <span className="text-blue-500">→</span> {label}: {val}
                      </li>
                    );
                  })}
                </ul>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(plan)}>
                    <Edit3 className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeleteId(plan._id)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'Create Plan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="plan-name"
                label="Name"
                placeholder="e.g. Starter"
                error={form.formState.errors.name?.message}
                {...register('name')}
              />
              <Controller
                control={control}
                name="code"
                render={({ field, fieldState }) => (
                  <Input
                    id="plan-code"
                    label="Code (e.g. STARTER)"
                    placeholder="STARTER"
                    value={field.value}
                    error={fieldState.error?.message}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <div>
                    <Label htmlFor="plan-type" className="text-sm">
                      Type
                    </Label>
                    <select
                      id="plan-type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value as 'free' | 'paid')}
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                )}
              />
              <Input
                id="plan-sort"
                label="Sort Order"
                type="number"
                min={0}
                max={1000}
                error={form.formState.errors.sortOrder?.message}
                {...register('sortOrder', { valueAsNumber: true })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                id="plan-price"
                label="Price (₹)"
                type="number"
                min={0}
                max={10000000}
                error={form.formState.errors.price?.message}
                {...register('price', { valueAsNumber: true })}
              />
              <Input
                id="plan-discount"
                label="Discount Price (₹)"
                type="number"
                min={0}
                max={10000000}
                error={form.formState.errors.discountPrice?.message}
                {...register('discountPrice', { valueAsNumber: true })}
              />
              <Input
                id="plan-duration"
                label="Duration (days)"
                type="number"
                min={1}
                max={36500}
                error={form.formState.errors.durationDays?.message}
                {...register('durationDays', { valueAsNumber: true })}
              />
            </div>
            <Textarea
              id="plan-desc"
              label="Description"
              rows={2}
              error={form.formState.errors.description?.message}
              {...register('description')}
            />

            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-semibold">Features</h3>
              {isStructured && derivedFeatures ? (
                <>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Read-only summary derived from the structured entitlements below. These values are always recomputed
                    server-side and cannot override the entitlements.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <DisplayFeatureRow label="Unlimited Courses" on={derivedFeatures.unlimitedCourses} />
                    <DisplayFeatureRow label="Advanced Analytics" on={derivedFeatures.advancedAnalytics} />
                    <DisplayFeatureRow label="Coupons" on={derivedFeatures.coupons} />
                    <DisplayFeatureRow label="Live Classes" on={derivedFeatures.liveClasses} />
                    <DisplayFeatureRow label="Featured Instructor" on={derivedFeatures.featuredInstructor} />
                    <DisplayFeatureRow label="Priority Support" on={derivedFeatures.prioritySupport} />
                    <DisplayFeatureRow label="Unlimited Storage" on={derivedFeatures.unlimitedStorage} />
                    <DisplayFeatureRow label="Premium Marketing" on={derivedFeatures.premiumMarketing} />
                    <DisplayFeatureRow label="Free Course Limit" on value={derivedFeatures.freeCoursesLimit} />
                    <DisplayFeatureRow label="Storage (MB)" on value={derivedFeatures.storageLimitMB} />
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-3 text-xs text-muted-foreground">
                    This plan uses the legacy flat features only. Structured entitlements are not enabled for it.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      control={control}
                      name="features.unlimitedCourses"
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                            aria-label="Unlimited Courses"
                          />
                          <Label className="text-sm">Unlimited Courses</Label>
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name="features.advancedAnalytics"
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                            aria-label="Advanced Analytics"
                          />
                          <Label className="text-sm">Advanced Analytics</Label>
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name="features.coupons"
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                            aria-label="Coupons"
                          />
                          <Label className="text-sm">Coupons</Label>
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name="features.liveClasses"
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                            aria-label="Live Classes"
                          />
                          <Label className="text-sm">Live Classes</Label>
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name="features.featuredInstructor"
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                            aria-label="Featured Instructor"
                          />
                          <Label className="text-sm">Featured Instructor</Label>
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name="features.prioritySupport"
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                            aria-label="Priority Support"
                          />
                          <Label className="text-sm">Priority Support</Label>
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name="features.unlimitedStorage"
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                            aria-label="Unlimited Storage"
                          />
                          <Label className="text-sm">Unlimited Storage</Label>
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name="features.premiumMarketing"
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={Boolean(field.value)}
                            onCheckedChange={field.onChange}
                            aria-label="Premium Marketing"
                          />
                          <Label className="text-sm">Premium Marketing</Label>
                        </div>
                      )}
                    />
                    <Input
                      type="number"
                      min={0}
                      max={10000}
                      label="Free Course Limit"
                      error={form.formState.errors.features?.freeCoursesLimit?.message}
                      {...register('features.freeCoursesLimit', { valueAsNumber: true })}
                    />
                    <Input
                      type="number"
                      min={0}
                      max={1000000}
                      label="Storage (MB)"
                      error={form.formState.errors.features?.storageLimitMB?.message}
                      {...register('features.storageLimitMB', { valueAsNumber: true })}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-semibold">
                Structured Entitlements{' '}
                <span className="font-normal text-muted-foreground">(source of truth for enforcement)</span>
              </h3>
              {!isStructured && (
                <p className="mb-3 text-xs text-muted-foreground">
                  This plan uses legacy features only. The advanced entitlement fields are not available until the plan
                  carries a structured entitlements block.
                </p>
              )}
              {isStructured && (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Courses</p>
                    <div className="grid grid-cols-2 gap-3">
                      <EntSwitch control={control} name="entitlements.courses.canCreateFree" label="Can create free" />
                      <EntSwitch control={control} name="entitlements.courses.canCreatePaid" label="Can create paid" />
                      <EntSwitch
                        control={control}
                        name="entitlements.courses.unlimitedCreationMode"
                        label="Unlimited creation"
                      />
                      <EntNumber
                        control={control}
                        name="entitlements.courses.maxCreationCount"
                        label="Creation window limit"
                      />
                      <EntNumber
                        control={control}
                        name="entitlements.courses.creationWindowDays"
                        label="Window (days)"
                      />
                      <EntNumber
                        control={control}
                        name="entitlements.courses.maxPublishedCourses"
                        label="Max published"
                      />
                      <EntNumber control={control} name="entitlements.courses.highCreationCap" label="High tier cap" />
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Students &amp; Storage</p>
                    <div className="grid grid-cols-2 gap-3">
                      <EntNumber control={control} name="entitlements.students.maxStudents" label="Max students" />
                      <EntNumber control={control} name="entitlements.storage.videoGB" label="Video storage (GB)" />
                      <EntNumber
                        control={control}
                        name="entitlements.storage.materialGB"
                        label="Material storage (GB)"
                      />
                      <EntNumber
                        control={control}
                        name="entitlements.storage.recordingGB"
                        label="Recording storage (GB)"
                      />
                      <EntNumber
                        control={control}
                        name="entitlements.storage.maxVideoFileSizeMB"
                        label="Max video size (MB)"
                      />
                      <EntSwitch control={control} name="entitlements.storage.unlimited" label="Unlimited storage" />
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Revenue (commission)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <EntSwitch control={control} name="entitlements.revenue.enabled" label="Commission enabled" />
                      <EntNumber control={control} name="entitlements.revenue.commissionPercent" label="Platform %" />
                      <EntNumber
                        control={control}
                        name="entitlements.revenue.instructorSharePercent"
                        label="Instructor %"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      Live Classes &amp; Certificates
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <EntSwitch control={control} name="entitlements.liveClasses.enabled" label="Live classes" />
                      <EntNumber control={control} name="entitlements.liveClasses.monthlyLimit" label="Monthly limit" />
                      <EntNumber
                        control={control}
                        name="entitlements.liveClasses.maxDurationMinutes"
                        label="Max duration (min)"
                      />
                      <EntSwitch control={control} name="entitlements.liveClasses.recording" label="Recording" />
                      <EntSwitch control={control} name="entitlements.certificates.enabled" label="Certificates" />
                      <EntSwitch
                        control={control}
                        name="entitlements.certificates.qrVerification"
                        label="QR verification"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      Marketing &amp; Analytics
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <EntSwitch control={control} name="entitlements.marketing.coupons" label="Coupons" />
                      <EntNumber
                        control={control}
                        name="entitlements.marketing.maxActiveCoupons"
                        label="Max active coupons"
                      />
                      <EntSwitch control={control} name="entitlements.marketing.bundles" label="Bundles" />
                      <EntSwitch
                        control={control}
                        name="entitlements.marketing.instructorSubscriptions"
                        label="Instructor subscriptions"
                      />
                      <EntSwitch control={control} name="entitlements.marketing.affiliate" label="Affiliates" />
                      <EntSwitch control={control} name="entitlements.analytics.advanced" label="Advanced analytics" />
                      <EntSwitch control={control} name="entitlements.analytics.export" label="Analytics export" />
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Support</p>
                    <Controller
                      control={control}
                      name="entitlements.support.level"
                      render={({ field }) => (
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value ?? 'none'}
                          onChange={(e) => field.onChange(e.target.value)}
                          aria-label="Support level"
                        >
                          <option value="none">None</option>
                          <option value="email">Email</option>
                          <option value="priority">Priority</option>
                          <option value="dedicated">Dedicated</option>
                        </select>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={field.value === 'active'}
                    onCheckedChange={(v) => field.onChange(v ? 'active' : 'inactive')}
                    aria-label="Active"
                  />
                  <Label>Active</Label>
                </div>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Update Plan' : 'Create Plan'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId!)}
        title="Delete Plan"
        description="Are you sure you want to delete this plan? This cannot be undone."
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
