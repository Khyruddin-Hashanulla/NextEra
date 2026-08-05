import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import { Save, User, Mail, Phone, MapPin, BookOpen, Award, Briefcase, Hash, Globe, Link as LinkIcon, Camera, Loader2 } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

function getAvatarUrl(profile: any, avatarVersion: number): string {
  if (!profile?.avatar?.url) return '';
  const url = profile.avatar.url;
  const timestamp = avatarVersion || Date.now();
  return `${url}?v=${timestamp}`;
}

function buildUpdatePayload(form: any): any {
  return {
    name: form.name,
    phone: form.phone,
    address: form.address,
    bio: form.bio,
    socialLinks: {
      youtube: form.socialLinks?.youtube || '',
      twitter: form.socialLinks?.twitter || '',
      linkedin: form.socialLinks?.linkedin || '',
      github: form.socialLinks?.github || '',
      portfolio: form.socialLinks?.portfolio || '',
      website: form.socialLinks?.website || '',
    },
    instructorProfile: {
      qualification: form.qualification || '',
      experience: form.experience || '',
      expertise: (form.expertise || '')
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean),
      taxDetails: { pan: form.pan || '', gst: form.gst || '' },
      bankDetails: {
        accountHolderName: form.accountHolderName || '',
        accountNumber: form.accountNumber || '',
        ifscCode: form.ifscCode || '',
        bankName: form.bankName || '',
        branch: form.branch || '',
        upiId: form.upiId || '',
      },
    },
  };
}

export function EditProfilePage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['instructor', 'profile'],
    queryFn: ({ signal }) => instructorApi.getProfile(signal).then((r) => r.data.data),
  });

  const [form, setForm] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);

  const initializeForm = useCallback((profileData: any) => {
    if (!profileData) return;
    setForm({
      name: profileData.name || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
      address: profileData.address || '',
      bio: profileData.bio || '',
      socialLinks: {
        linkedin: profileData.socialLinks?.linkedin || '',
        twitter: profileData.socialLinks?.twitter || '',
        github: profileData.socialLinks?.github || '',
        portfolio: profileData.socialLinks?.portfolio || '',
        website: profileData.socialLinks?.website || '',
      },
      qualification: profileData.instructorProfile?.qualification || '',
      experience: profileData.instructorProfile?.experience || '',
      expertise: profileData.instructorProfile?.expertise?.join(', ') || '',
      pan: profileData.instructorProfile?.taxDetails?.pan || '',
      gst: profileData.instructorProfile?.taxDetails?.gst || '',
      accountHolderName: profileData.instructorProfile?.bankDetails?.accountHolderName || '',
      accountNumber: profileData.instructorProfile?.bankDetails?.accountNumber || '',
      ifscCode: profileData.instructorProfile?.bankDetails?.ifscCode || '',
      bankName: profileData.instructorProfile?.bankDetails?.bankName || '',
      branch: profileData.instructorProfile?.bankDetails?.branch || '',
      upiId: profileData.instructorProfile?.bankDetails?.upiId || '',
    });
  }, []);

  useEffect(() => {
    if (profile) {
      initializeForm(profile);
    }
  }, [profile, initializeForm]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof form) => instructorApi.updateProfile(buildUpdatePayload(data)).then((r) => r.data.data),
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: async (updatedProfile) => {
      await queryClient.invalidateQueries({ queryKey: ['instructor', 'profile'] });
      await refetch();
      initializeForm(updatedProfile || profile);
      addToast({ title: 'Profile updated', description: 'All changes have been saved.', variant: 'success' });
    },
    onError: (error: any) => {
      addToast({ title: 'Update failed', description: error?.response?.data?.message || 'Failed to save profile.', variant: 'error' });
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (formData: FormData) => instructorApi.uploadAvatar(formData),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['instructor', 'profile'] });
      await refetch();
      setAvatarVersion(Date.now());
      addToast({ title: 'Profile picture updated', description: 'Your avatar has been successfully updated.', variant: 'success' });
    },
    onError: () => addToast({ title: 'Upload failed', description: 'Failed to upload profile picture. Please try again.', variant: 'error' }),
  });

  const update = (field: string, value: string) => {
    if (field.startsWith('socialLinks.')) {
      const key = field.split('.')[1];
      setForm((prev: typeof form) => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [key]: value },
      }));
    } else {
      setForm((prev: typeof form) => ({ ...prev, [field]: value }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, j) => <Skeleton key={j} className="h-10 w-full" />)}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!form) return null;

  const avatarUrl = getAvatarUrl(profile, avatarVersion);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
        <p className="mt-1 text-muted-foreground">Update your instructor profile</p>
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-primary" /> Personal Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label><User className="mr-1 inline h-3 w-3" /> Name</Label>
              <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label><Mail className="mr-1 inline h-3 w-3" /> Email</Label>
              <Input value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="Email address" type="email" />
            </div>
            <div className="space-y-2">
              <Label><Phone className="mr-1 inline h-3 w-3" /> Phone</Label>
              <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="Phone number" type="tel" />
            </div>
            <div className="space-y-2">
              <Label><MapPin className="mr-1 inline h-3 w-3" /> Address</Label>
              <Input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Address" />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} rows={3} placeholder="Tell students about yourself..." maxLength={500} />
              <p className="text-xs text-muted-foreground text-right">{form.bio.length}/500</p>
            </div>
            <div className="space-y-2 pt-2 border-t">
              <Label className="flex items-center gap-2">
                <Camera className="h-4 w-4" /> Profile Picture
              </Label>
              <div className="group relative">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary overflow-hidden relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      profile?.name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer">
                    <Camera className="h-6 w-6" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                          addToast({ title: 'Invalid file type', description: 'Please upload a JPG, PNG, or WebP image.', variant: 'error' });
                          return;
                        }

                        if (file.size > 2 * 1024 * 1024) {
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

                            canvas.toBlob(async (blob) => {
                              if (!blob) return;
                              const formData = new FormData();
                              formData.append('avatar', blob, file.name);

                              try {
                                addToast({ title: 'Uploading...', description: 'Your profile picture is being uploaded.', variant: 'info' });
                                await avatarMutation.mutateAsync(formData);
                              } catch (error) {
                                addToast({ title: 'Upload failed', description: 'Failed to upload profile picture. Please try again.', variant: 'error' });
                              }
                            }, 'image/jpeg', 0.9);
                          };
                          img.src = event.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Click to change photo (max 2MB, JPG/PNG/WebP)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LinkIcon className="h-5 w-5 text-primary" /> Social Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input value={form.socialLinks?.linkedin || ''} onChange={(e) => update('socialLinks.linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="space-y-2">
              <Label>Twitter</Label>
              <Input value={form.socialLinks?.twitter || ''} onChange={(e) => update('socialLinks.twitter', e.target.value)} placeholder="https://twitter.com/..." />
            </div>
            <div className="space-y-2">
              <Label>GitHub</Label>
              <Input value={form.socialLinks?.github || ''} onChange={(e) => update('socialLinks.github', e.target.value)} placeholder="https://github.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Portfolio</Label>
              <Input value={form.socialLinks?.portfolio || ''} onChange={(e) => update('socialLinks.portfolio', e.target.value)} placeholder="https://yourportfolio.com" />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.socialLinks?.website || ''} onChange={(e) => update('socialLinks.website', e.target.value)} placeholder="https://yourwebsite.com" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5 text-primary" /> Professional Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label><BookOpen className="mr-1 inline h-3 w-3" /> Qualification</Label>
              <Input value={form.qualification} onChange={(e) => update('qualification', e.target.value)} placeholder="e.g., PhD in Computer Science" />
            </div>
            <div className="space-y-2">
              <Label><Briefcase className="mr-1 inline h-3 w-3" /> Experience</Label>
              <Textarea value={form.experience} onChange={(e) => update('experience', e.target.value)} rows={2} placeholder="Years of experience and highlights" />
            </div>
            <div className="space-y-2">
              <Label><Hash className="mr-1 inline h-3 w-3" /> Expertise (comma-separated)</Label>
              <Input value={form.expertise} onChange={(e) => update('expertise', e.target.value)} placeholder="React, Node.js, TypeScript, AWS" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5 text-primary" /> Tax & Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-muted-foreground">Tax Details</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>PAN</Label>
                  <Input value={form.pan} onChange={(e) => update('pan', e.target.value)} placeholder="ABCDE1234F" maxLength={10} />
                </div>
                <div className="space-y-2">
                  <Label>GST</Label>
                  <Input value={form.gst} onChange={(e) => update('gst', e.target.value)} placeholder="27ABCDE1234F1Z5" maxLength={15} />
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-muted-foreground">Bank Details</h4>
              <div className="space-y-2">
                <Label>Account Holder Name</Label>
                <Input value={form.accountHolderName} onChange={(e) => update('accountHolderName', e.target.value)} placeholder="As per bank records" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input value={form.accountNumber} onChange={(e) => update('accountNumber', e.target.value)} placeholder="1234567890" />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input value={form.ifscCode} onChange={(e) => update('ifscCode', e.target.value)} placeholder="SBIN0001234" maxLength={11} />
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input value={form.bankName} onChange={(e) => update('bankName', e.target.value)} placeholder="State Bank of India" />
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Input value={form.branch} onChange={(e) => update('branch', e.target.value)} placeholder="Main Branch" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>UPI ID</Label>
                <Input value={form.upiId} onChange={(e) => update('upiId', e.target.value)} placeholder="name@upi" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="flex justify-end pt-4 border-t">
        <Button
          onClick={() => updateProfileMutation.mutate(form)}
          disabled={isSaving || updateProfileMutation.isPending}
          loading={isSaving || updateProfileMutation.isPending}
        >
          <Save className="mr-1.5 h-4 w-4" /> Save Changes
        </Button>
      </motion.div>
    </motion.div>
  );
}