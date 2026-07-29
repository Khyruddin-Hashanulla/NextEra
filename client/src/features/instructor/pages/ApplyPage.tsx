import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/providers/ToastProvider';
import { Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';

export function ApplyPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    qualification: '', experience: '', expertise: '', reason: '',
    linkedin: '', github: '', portfolio: '', website: '', bio: '', categories: '',
    photo: null as File | null,
    resume: null as File | null,
    demoVideo: null as File | null,
    identityProof: null as File | null,
    taxPan: '', taxGst: '',
    bankHolder: '', bankAccount: '', bankIfsc: '', bankName: '', bankBranch: '', bankUpi: '',
  });
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['instructor', 'application-status'],
    queryFn: () => instructorApi.getApplicationStatus().then((r) => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const fd = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          if (val instanceof File) fd.append(key, val);
          else if (typeof val === 'string') fd.append(key, val);
        }
      });
      return instructorApi.apply(fd as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'application-status'] });
      addToast({ title: 'Application submitted', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to submit', variant: 'error' }),
  });

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (statusData?.applied) {
    const status = statusData.status;
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            {status === 'approved' ? (
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            ) : status === 'rejected' ? (
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
            ) : (
              <Clock className="mx-auto h-12 w-12 text-yellow-500" />
            )}
            <h2 className="mt-4 text-xl font-semibold capitalize">{status}</h2>
            <p className="mt-2 text-muted-foreground">
              {status === 'approved'
                ? 'Congratulations! You are now an instructor.'
                : status === 'rejected'
                ? 'Your application was not approved. You can reapply.'
                : 'Your application is being reviewed.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const setFile = (field: string) => (file: File | null) => {
    setForm({ ...form, [field]: file });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Become an Instructor</CardTitle>
          <CardDescription>Fill in all details to apply as an instructor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <FileUpload
              accept="image/*"
              maxSize={5 * 1024 * 1024}
              label="Upload profile photo"
              value={form.photo}
              onChange={setFile('photo')}
            />
          </div>

          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Qualifications *</Label>
            <Textarea value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Teaching Experience *</Label>
            <Textarea value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} rows={3} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Expertise (comma-separated)</Label>
              <Input value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Categories (comma-separated IDs)</Label>
              <Input value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Why do you want to teach? *</Label>
            <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Resume</Label>
            <FileUpload
              accept=".pdf,.doc,.docx,application/pdf,application/msword"
              maxSize={10 * 1024 * 1024}
              label="Upload resume"
              value={form.resume}
              onChange={setFile('resume')}
            />
          </div>

          <div className="space-y-2">
            <Label>Identity Proof</Label>
            <FileUpload
              accept="image/*,.pdf"
              maxSize={10 * 1024 * 1024}
              label="Upload identity proof"
              value={form.identityProof}
              onChange={setFile('identityProof')}
            />
          </div>

          <div className="space-y-2">
            <Label>Demo Video</Label>
            <FileUpload
              accept="video/*"
              maxSize={200 * 1024 * 1024}
              label="Upload demo video"
              value={form.demoVideo}
              onChange={setFile('demoVideo')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>GitHub</Label>
              <Input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Portfolio</Label>
              <Input value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">Tax Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>PAN</Label>
                <Input value={form.taxPan} onChange={(e) => setForm({ ...form, taxPan: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>GST</Label>
                <Input value={form.taxGst} onChange={(e) => setForm({ ...form, taxGst: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">Bank Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Account Holder Name</Label>
                <Input value={form.bankHolder} onChange={(e) => setForm({ ...form, bankHolder: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>IFSC Code</Label>
                <Input value={form.bankIfsc} onChange={(e) => setForm({ ...form, bankIfsc: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Input value={form.bankBranch} onChange={(e) => setForm({ ...form, bankBranch: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input value={form.bankUpi} onChange={(e) => setForm({ ...form, bankUpi: e.target.value })} />
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.qualification || !form.experience || !form.reason || !form.name || !form.email}
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Application'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
