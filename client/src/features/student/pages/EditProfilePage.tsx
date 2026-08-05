import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/endpoints/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { QUERY_KEYS } from '@/lib/constants';
import { User, Mail, Globe, Linkedin, Github, Save, Camera, Link as LinkIcon, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { AxiosError } from 'axios';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const PROFILE_QUERY_KEY = ['user', 'profile'] as const;

const AVATAR_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_SIZE = 2 * 1024 * 1024;

function getAvatarUrl(profile: { avatar?: { url?: string } } | undefined, avatarVersion: number): string {
  const url = profile?.avatar?.url;
  if (!url) return '';
  return avatarVersion ? `${url}?v=${avatarVersion}` : url;
}

function isValidUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

interface UpdateError {
  message?: string;
  response?: { data?: { message?: string } };
}

export function EditProfilePage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: ({ signal }) => userApi.getMe(signal).then((r) => r.data.data),
  });

  const [form, setForm] = useState({
    name: '',
    bio: '',
    socialLinks: { linkedin: '', github: '', portfolio: '' },
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarPreviewRef = useRef<string | null>(null);

  const toSafeSocialUrl = useCallback((value: string | undefined): string => {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return '';
    if (trimmed.includes('@') && !/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return '';
    return trimmed;
  }, []);

  const initializeForm = useCallback((profileData: any) => {
    if (!profileData) return;
    setForm({
      name: profileData.name || '',
      bio: profileData.bio || '',
      socialLinks: {
        linkedin: toSafeSocialUrl(profileData.socialLinks?.linkedin),
        github: toSafeSocialUrl(profileData.socialLinks?.github),
        portfolio: toSafeSocialUrl(profileData.socialLinks?.portfolio),
      },
    });
  }, [toSafeSocialUrl]);

  useEffect(() => {
    if (profile) {
      initializeForm(profile);
    }
  }, [profile, initializeForm]);

  useEffect(() => {
    return () => {
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
      }
    };
  }, []);

  const updateMutation = useMutation({
    mutationFn: () => {
      const social = form.socialLinks;
      const invalidField = (['linkedin', 'github', 'portfolio'] as const).find((key) => {
        const value = social[key]?.trim() ?? '';
        return value !== '' && !isValidUrl(value);
      });
      if (invalidField) {
        const label = invalidField.charAt(0).toUpperCase() + invalidField.slice(1);
        throw new Error(`${label} must be a valid URL (e.g., https://${invalidField}.com/...)`);
      }

      return userApi
        .updateProfile({
          name: form.name.trim(),
          bio: form.bio,
          socialLinks: {
            linkedin: social.linkedin.trim(),
            github: social.github.trim(),
            portfolio: social.portfolio.trim(),
            youtube: '',
            twitter: '',
            website: '',
          },
        })
        .then((r) => r.data.data);
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        queryClient.setQueryData(QUERY_KEYS.auth.user, updatedUser);
        queryClient.setQueryData(PROFILE_QUERY_KEY, updatedUser);
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.user });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      addToast({ title: 'Profile updated', description: 'All changes have been saved.', variant: 'success' });
    },
    onError: (error) => {
      const err = error as UpdateError;
      const message = err?.response?.data?.message || err?.message;
      addToast({ title: 'Update failed', description: message || 'Failed to save your profile. Please try again.', variant: 'error' });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (formData: FormData) => userApi.uploadAvatar(formData).then((r) => r.data.data),
    onSuccess: (result) => {
      if (result?.url) {
        const avatar = { url: result.url, publicId: result.publicId };
        queryClient.setQueryData(QUERY_KEYS.auth.user, (old: any) => (old ? { ...old, avatar } : old));
        queryClient.setQueryData(PROFILE_QUERY_KEY, (old: any) => (old ? { ...old, avatar } : old));
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.user });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
        avatarPreviewRef.current = null;
      }
      setAvatarPreview(null);
      setAvatarVersion(Date.now());
      addToast({ title: 'Profile picture updated', description: 'Your avatar has been successfully updated.', variant: 'success' });
    },
    onError: () => {
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
        avatarPreviewRef.current = null;
      }
      setAvatarPreview(null);
      addToast({ title: 'Upload failed', description: 'Failed to upload profile picture. Please try again.', variant: 'error' });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }),
    onSuccess: () => {
      addToast({ title: 'Password changed', description: 'Your password has been updated successfully.', variant: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error) => {
      const err = error as AxiosError<{ message?: string }>;
      addToast({ title: 'Password change failed', description: err?.response?.data?.message || 'Please try again.', variant: 'error' });
    },
  });

  const passwordMismatch =
    passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword.length > 0;

  const updateProfileField = (field: string, value: string) => {
    if (field.startsWith('socialLinks.')) {
      const key = field.split('.')[1];
      setForm((prev) => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [key]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleAvatarChange = (file: File | undefined) => {
    if (!file) return;

    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      addToast({ title: 'Invalid file type', description: 'Please upload a JPG, PNG, or WebP image.', variant: 'error' });
      return;
    }

    if (file.size > AVATAR_MAX_SIZE) {
      addToast({ title: 'File too large', description: 'Image must be less than 2MB.', variant: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const maxSize = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height = Math.floor(height * (maxSize / width));
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.floor(width * (maxSize / height));
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const previewUrl = URL.createObjectURL(blob);
          avatarPreviewRef.current = previewUrl;
          setAvatarPreview(previewUrl);

          const formData = new FormData();
          formData.append('avatar', blob, file.name);
          addToast({ title: 'Uploading...', description: 'Your profile picture is being uploaded.', variant: 'info' });
          avatarMutation.mutate(formData);
        }, 'image/jpeg', 0.9);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const avatarSrc = avatarPreview || getAvatarUrl(profile, avatarVersion);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent className="space-y-4">
                {[...Array(2)].map((_, j) => <Skeleton key={j} className="h-10 w-full" />)}
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
        <h1 className="text-2xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account and preferences</p>
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-primary" /> Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="group relative shrink-0">
                <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    profile?.name?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100" title="Change profile photo">
                  <Camera className="h-5 w-5" />
                  <input
                    type="file"
                    accept={AVATAR_ACCEPTED_TYPES.join(',')}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      handleAvatarChange(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold leading-tight">{profile?.name || 'User'}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                </div>
                <div className="mt-1.5">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                    {profile?.role || 'student'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Click the camera icon to update your profile photo (JPG, PNG, or WebP · max 2MB).</p>

            <div className="space-y-2 pt-2 border-t">
              <label className="text-sm font-medium text-foreground"><User className="mr-1 inline h-3 w-3" /> Full Name</label>
              <Input
                value={form.name}
                onChange={(e) => updateProfileField('name', e.target.value)}
                placeholder="Your full name"
                icon={<User className="h-4 w-4" />}
                iconPosition="left"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Bio</label>
              <Textarea
                value={form.bio}
                onChange={(e) => updateProfileField('bio', e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Tell us about yourself..."
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground text-right">{form.bio.length}/500</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5 text-primary" /> Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">LinkedIn</label>
              <Input
                value={form.socialLinks.linkedin}
                onChange={(e) => updateProfileField('socialLinks.linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/..."
                icon={<Linkedin className="h-4 w-4" />}
                iconPosition="left"
                autoComplete="off"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">GitHub</label>
              <Input
                value={form.socialLinks.github}
                onChange={(e) => updateProfileField('socialLinks.github', e.target.value)}
                placeholder="https://github.com/..."
                icon={<Github className="h-4 w-4" />}
                iconPosition="left"
                autoComplete="off"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Portfolio</label>
              <Input
                value={form.socialLinks.portfolio}
                onChange={(e) => updateProfileField('socialLinks.portfolio', e.target.value)}
                placeholder="https://yourportfolio.com/..."
                icon={<LinkIcon className="h-4 w-4" />}
                iconPosition="left"
                autoComplete="off"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Showcase your projects, certificates, or work samples.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-5 w-5 text-primary" /> Change Password
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

      <motion.div variants={item} className="flex justify-end pt-4 border-t">
        <Button
          onClick={() => updateMutation.mutate()}
          loading={updateMutation.isPending}
          icon={<Save className="h-4 w-4" />}
        >
          Save Changes
        </Button>
      </motion.div>
    </motion.div>
  );
}
