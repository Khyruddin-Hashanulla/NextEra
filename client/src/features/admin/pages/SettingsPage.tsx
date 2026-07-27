import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { AdminHeader } from '../components/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/providers/ToastProvider';
import { Loader2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PlatformSettings } from '@/types/admin';

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
    socialLinks: { youtube: '', twitter: '', linkedin: '', instagram: '', facebook: '' },
   });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings().then((r) => r.data.data),
   });

  useEffect(() => {
    if (settings) setForm(settings as PlatformSettings);
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PlatformSettings>) => adminApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings']});
      addToast({ title: 'Settings saved', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to save', variant: 'error' }),
   });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  return (
    <div>
      <AdminHeader title="Platform Settings" description="Configure platform-wide settings" />

      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader><CardTitle>General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform Name</Label>
                <Input value={form.platformName} onChange={(e) => setForm({ ...form, platformName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Platform Email</Label>
                <Input type="email" value={form.platformEmail} onChange={(e) => setForm({ ...form, platformEmail: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Input value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} maxLength={3} className="w-20 uppercase" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Features</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="cursor-pointer">Allow User Registration</Label>
              <input type="checkbox" checked={form.allowRegistration} onChange={(e) => setForm({ ...form, allowRegistration: e.target.checked })} className="h-5 w-5" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="cursor-pointer">Maintenance Mode</Label>
              <input type="checkbox" checked={form.maintenanceMode} onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })} className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <Label>Default User Role</Label>
              <select value={form.defaultUserRole} onChange={(e) => setForm({ ...form, defaultUserRole: e.target.value as any })}
                className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm">
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(['youtube', 'twitter', 'linkedin', 'instagram'] as const).map((platform) => (
              <div key={platform} className="space-y-2">
                <Label className="capitalize">{platform}</Label>
                <Input value={form.socialLinks[platform]} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, [platform]: e.target.value } })} placeholder={`https://${platform}.com/...`} />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
