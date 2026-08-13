import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PlatformSettings } from '@/types/admin';
import { Save, Settings as SettingsIcon, Globe, Shield, DollarSign, RotateCcw } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [form, setForm] = useState<PlatformSettings>({
    platformName: 'NextEra',
    platformEmail: '',
    logo: { url: '', publicId: '' },
    favicon: { url: '', publicId: '' },
    metaDescription: '',
    maintenanceMode: false,
    allowRegistration: true,
    defaultUserRole: 'student',
    currency: 'INR',
    commissionPercentage: 25,
    gstPercentage: 0,
    minimumPayoutAmount: 100,
    supportEmail: '',
    timezone: 'UTC',
    defaultInstructorPlan: 'none',
    refundWindowDays: 14,
    socialLinks: { youtube: '', twitter: '', linkedin: '', instagram: '', facebook: '' },
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: ({ signal }) => adminApi.getSettings(signal).then((r) => r.data.data),
  });

  useEffect(() => {
    if (settings) setForm(settings as PlatformSettings);
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PlatformSettings>) => adminApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      addToast({ title: 'Settings saved', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to save', variant: 'error' }),
  });

  const resetDefaults = () => {
    setForm((prev) => ({
      ...prev,
      commissionPercentage: 25,
      gstPercentage: 0,
      minimumPayoutAmount: 100,
      refundWindowDays: 14,
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="max-w-3xl space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="mt-1 text-muted-foreground">Configure platform-wide settings</p>
      </motion.div>

      <motion.div variants={item} className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5 text-primary" /> General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform Name</Label>
                <Input value={form.platformName} onChange={(e) => setForm({ ...form, platformName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Platform Email</Label>
                <Input
                  type="email"
                  value={form.platformEmail}
                  onChange={(e) => setForm({ ...form, platformEmail: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Input
                value={form.metaDescription}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                maxLength={3}
                className="w-20 uppercase"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" /> Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="cursor-pointer">Allow User Registration</Label>
              <input
                type="checkbox"
                checked={form.allowRegistration}
                onChange={(e) => setForm({ ...form, allowRegistration: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="cursor-pointer">Maintenance Mode</Label>
              <input
                type="checkbox"
                checked={form.maintenanceMode}
                onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label>Default User Role</Label>
              <select
                value={form.defaultUserRole}
                onChange={(e) => setForm({ ...form, defaultUserRole: e.target.value as any })}
                className="flex h-10 w-full max-w-xs rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-primary" /> Commission & Payouts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commission (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.commissionPercentage}
                  onChange={(e) => setForm({ ...form, commissionPercentage: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>GST (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.gstPercentage}
                  onChange={(e) => setForm({ ...form, gstPercentage: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Payout Amount</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.minimumPayoutAmount}
                  onChange={(e) => setForm({ ...form, minimumPayoutAmount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Refund Window (days)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.refundWindowDays}
                  onChange={(e) => setForm({ ...form, refundWindowDays: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Default Instructor Plan</Label>
              <Input
                value={form.defaultInstructorPlan}
                onChange={(e) => setForm({ ...form, defaultInstructorPlan: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetDefaults}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset Financial Defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SettingsIcon className="h-5 w-5 text-primary" /> Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['youtube', 'twitter', 'linkedin', 'instagram'] as const).map((platform) => (
              <div key={platform} className="space-y-2">
                <Label className="capitalize">{platform}</Label>
                <Input
                  value={form.socialLinks[platform]}
                  onChange={(e) =>
                    setForm({ ...form, socialLinks: { ...form.socialLinks, [platform]: e.target.value } })
                  }
                  placeholder={`https://${platform}.com/...`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending} loading={updateMutation.isPending}>
            <Save className="mr-1.5 h-4 w-4" /> Save Settings
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
