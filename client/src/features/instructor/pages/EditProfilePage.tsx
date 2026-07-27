import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/providers/ToastProvider';
import { Loader2, Save, User, Mail, Phone, MapPin, BookOpen, Award, Briefcase, Hash, Globe, Link as LinkIcon } from 'lucide-react';

export function EditProfilePage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['instructor', 'profile'],
    queryFn: () => instructorApi.getProfile().then((r) => r.data.data),
  });

  const [form, setForm] = useState<any>(null);

  React.useEffect(() => {
    if (profile && !form) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        bio: profile.bio || '',
        linkedin: profile.socialLinks?.linkedin || '',
        twitter: profile.socialLinks?.twitter || '',
        github: profile.socialLinks?.github || '',
        portfolio: profile.socialLinks?.portfolio || '',
        website: profile.socialLinks?.website || '',
        qualification: profile.instructorProfile?.qualification || '',
        experience: profile.instructorProfile?.experience || '',
        expertise: profile.instructorProfile?.expertise?.join(', ') || '',
        pan: profile.instructorProfile?.taxDetails?.pan || '',
        gst: profile.instructorProfile?.taxDetails?.gst || '',
        accountHolderName: profile.instructorProfile?.bankDetails?.accountHolderName || '',
        accountNumber: profile.instructorProfile?.bankDetails?.accountNumber || '',
        ifscCode: profile.instructorProfile?.bankDetails?.ifscCode || '',
        bankName: profile.instructorProfile?.bankDetails?.bankName || '',
        branch: profile.instructorProfile?.bankDetails?.branch || '',
        upiId: profile.instructorProfile?.bankDetails?.upiId || '',
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (data: typeof form) => instructorApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'profile'] });
      addToast({ title: 'Profile updated', variant: 'success' });
    },
    onError: () => addToast({ title: 'Update failed', variant: 'error' }),
  });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!form) return null;

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <div>
      <AdminHeader title="Edit Profile" description="Update your instructor profile" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Personal Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label><User className="mr-1 inline h-3 w-3" />Name</Label>
              <Input value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label><Mail className="mr-1 inline h-3 w-3" />Email</Label>
              <Input value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label><Phone className="mr-1 inline h-3 w-3" />Phone</Label>
              <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label><MapPin className="mr-1 inline h-3 w-3" />Address</Label>
              <Input value={form.address} onChange={(e) => update('address', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5" />Social Links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input value={form.linkedin} onChange={(e) => update('linkedin', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Twitter</Label>
              <Input value={form.twitter} onChange={(e) => update('twitter', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>GitHub</Label>
              <Input value={form.github} onChange={(e) => update('github', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Portfolio</Label>
              <Input value={form.portfolio} onChange={(e) => update('portfolio', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => update('website', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Professional Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label><BookOpen className="mr-1 inline h-3 w-3" />Qualification</Label>
              <Input value={form.qualification} onChange={(e) => update('qualification', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label><Briefcase className="mr-1 inline h-3 w-3" />Experience</Label>
              <Textarea value={form.experience} onChange={(e) => update('experience', e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label><Hash className="mr-1 inline h-3 w-3" />Expertise (comma-separated)</Label>
              <Input value={form.expertise} onChange={(e) => update('expertise', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Tax & Bank</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Tax Details</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>PAN</Label>
                <Input value={form.pan} onChange={(e) => update('pan', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>GST</Label>
                <Input value={form.gst} onChange={(e) => update('gst', e.target.value)} />
              </div>
            </div>
            <h4 className="text-sm font-semibold text-muted-foreground">Bank Details</h4>
            <div className="space-y-2">
              <Label>Account Holder</Label>
              <Input value={form.accountHolderName} onChange={(e) => update('accountHolderName', e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input value={form.accountNumber} onChange={(e) => update('accountNumber', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>IFSC Code</Label>
                <Input value={form.ifscCode} onChange={(e) => update('ifscCode', e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input value={form.bankName} onChange={(e) => update('bankName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Input value={form.branch} onChange={(e) => update('branch', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>UPI ID</Label>
              <Input value={form.upiId} onChange={(e) => update('upiId', e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
          {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
        </Button>
      </div>
    </div>
  );
}
