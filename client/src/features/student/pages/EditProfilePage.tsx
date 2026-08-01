import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/endpoints/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { QUERY_KEYS } from '@/lib/constants';
import { User, Mail, Lock, Globe, Youtube, Twitter, Linkedin, Github, Save, Camera, Loader2, Palette } from 'lucide-react';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const sectionItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function EditProfilePage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: ({ signal }) => userApi.getMe(signal).then((r) => r.data.data),
  });

  const [form, setForm] = useState({
    name: '',
    bio: '',
    socialLinks: { youtube: '', twitter: '', linkedin: '', github: '' },
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        bio: profile.bio || '',
        socialLinks: profile.socialLinks || { youtube: '', twitter: '', linkedin: '', github: '' },
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () => userApi.updateProfile(form),
    onSuccess: () => {
      addToast({ title: 'Profile updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.user });
    },
    onError: () => {
      addToast({ title: 'Update failed', variant: 'error' });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => userApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
    onSuccess: () => {
      addToast({ title: 'Password changed', variant: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: () => {
      addToast({ title: 'Password change failed', variant: 'error' });
    },
  });

  const passwordMismatch =
    passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-2xl space-y-6">
      <motion.div variants={sectionItem}>
        <h1 className="text-2xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account settings</p>
      </motion.div>

      <motion.div variants={sectionItem}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="group relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
                  {profile?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <button
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Change avatar"
                >
                  <Camera className="h-6 w-6" />
                </button>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg font-semibold">{profile?.name || 'User'}</p>
                <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground sm:justify-start">
                  <Mail className="h-3.5 w-3.5" />
                  {profile?.email}
                </p>
                <span className="mt-1 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium capitalize text-primary">
                  {profile?.role || 'student'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                icon={<User className="h-4 w-4" />}
                iconPosition="left"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Bio</label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                maxLength={500}
                placeholder="Tell us about yourself..."
              />
              <p className="text-xs text-muted-foreground">{form.bio.length}/500</p>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-foreground">
                <Globe className="mr-1.5 inline h-4 w-4 text-muted-foreground" />
                Social Links
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={form.socialLinks.youtube}
                  onChange={(e) =>
                    setForm({ ...form, socialLinks: { ...form.socialLinks, youtube: e.target.value } })
                  }
                  placeholder="https://youtube.com/..."
                  icon={<Youtube className="h-4 w-4" />}
                  iconPosition="left"
                />
                <Input
                  value={form.socialLinks.twitter}
                  onChange={(e) =>
                    setForm({ ...form, socialLinks: { ...form.socialLinks, twitter: e.target.value } })
                  }
                  placeholder="https://twitter.com/..."
                  icon={<Twitter className="h-4 w-4" />}
                  iconPosition="left"
                />
                <Input
                  value={form.socialLinks.linkedin}
                  onChange={(e) =>
                    setForm({ ...form, socialLinks: { ...form.socialLinks, linkedin: e.target.value } })
                  }
                  placeholder="https://linkedin.com/..."
                  icon={<Linkedin className="h-4 w-4" />}
                  iconPosition="left"
                />
                <Input
                  value={form.socialLinks.github}
                  onChange={(e) =>
                    setForm({ ...form, socialLinks: { ...form.socialLinks, github: e.target.value } })
                  }
                  placeholder="https://github.com/..."
                  icon={<Github className="h-4 w-4" />}
                  iconPosition="left"
                />
              </div>
            </div>

            <Button
              onClick={() => updateMutation.mutate()}
              loading={updateMutation.isPending}
              icon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={sectionItem}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Theme Preference</label>
              <p className="text-sm text-muted-foreground">Choose between light, dark, or system theme.</p>
              <ThemeSwitcher />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={sectionItem}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-primary" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              label="Current Password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="Enter current password"
              icon={<Lock className="h-4 w-4" />}
              iconPosition="left"
            />
            <Input
              type="password"
              label="New Password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="Enter new password"
              icon={<Lock className="h-4 w-4" />}
              iconPosition="left"
            />
            <Input
              type="password"
              label="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              error={passwordMismatch ? 'Passwords do not match' : undefined}
              icon={<Lock className="h-4 w-4" />}
              iconPosition="left"
            />

            <Button
              onClick={() => passwordMutation.mutate()}
              disabled={
                passwordMutation.isPending ||
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                passwordMismatch
              }
              loading={passwordMutation.isPending}
              variant="outline"
            >
              Change Password
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
