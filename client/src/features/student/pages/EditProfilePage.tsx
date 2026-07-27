import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/providers/ToastProvider';
import { Loader2, User, Mail, Lock } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

export function EditProfilePage() {
  const { addToast } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => axiosInstance.get<{ data: any }>('/users/me').then((r: any) => r.data.data),
  });

  const [form, setForm] = useState({ name: '', bio: '', socialLinks: { youtube: '', twitter: '', linkedin: '', github: '' } });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name || '', bio: profile.bio || '', socialLinks: profile.socialLinks || { youtube: '', twitter: '', linkedin: '', github: '' } });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () => axiosInstance.put('/users/me', form),
    onSuccess: () => { addToast({ title: 'Profile updated', variant: 'success' }); },
    onError: () => { addToast({ title: 'Update failed', variant: 'error' }); },
  });

  const passwordMutation = useMutation({
    mutationFn: () => axiosInstance.put('/users/me/password', passwordForm),
    onSuccess: () => {
      addToast({ title: 'Password changed', variant: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: () => { addToast({ title: 'Password change failed', variant: 'error' }); },
  });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5" /> Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3" /> {profile?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">Role: {profile?.role}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} maxLength={500} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>YouTube</Label>
              <Input value={form.socialLinks.youtube} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, youtube: e.target.value } })} placeholder="https://youtube.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Twitter</Label>
              <Input value={form.socialLinks.twitter} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, twitter: e.target.value } })} placeholder="https://twitter.com/..." />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input value={form.socialLinks.linkedin} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, linkedin: e.target.value } })} placeholder="https://linkedin.com/..." />
            </div>
            <div className="space-y-2">
              <Label>GitHub</Label>
              <Input value={form.socialLinks.github} onChange={(e) => setForm({ ...form, socialLinks: { ...form.socialLinks, github: e.target.value } })} placeholder="https://github.com/..." />
            </div>
          </div>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Lock className="h-5 w-5" /> Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
          </div>
          <Button onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}>
            {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
