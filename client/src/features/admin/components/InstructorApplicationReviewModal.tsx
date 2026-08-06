import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ExternalLink, Download, CheckCircle2, XCircle, GraduationCap, Link2,
  FileText, CreditCard, MapPin, Phone, Mail, Video, ShieldCheck, Landmark, UserRound,
} from 'lucide-react';
import { adminApi } from '@/api/endpoints/admin';
import { InstructorApplication } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/providers/ToastProvider';
import { cn } from '@/lib/utils';

interface Props {
  applicationId: string | null;
  onOpenChange: (open: boolean) => void;
}

type Decision = 'approve' | 'reject' | null;

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '—');
const maskAccountNumber = (value?: string) =>
  value ? `•••• ${value.slice(-4)}` : '—';

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || '—'}</dd>
    </div>
  );
}

function FileLink({ url, label }: { url?: string; label: string }) {
  if (!url) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <a href={url} target="_blank" rel="noreferrer">
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View
        </a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={url} download>
          <Download className="mr-1.5 h-3.5 w-3.5" /> {label}
        </a>
      </Button>
    </div>
  );
}

function Section({
  title, icon: Icon, children, className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function InstructorApplicationReviewModal({ applicationId, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [decision, setDecision] = useState<Decision>(null);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');

  const { data: application, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'instructors', 'detail', applicationId],
    queryFn: ({ signal }) =>
      adminApi.getInstructorApplicationDetail(applicationId!, signal).then((r) => r.data.data),
    enabled: !!applicationId,
    retry: 1,
  });

  const close = () => {
    setDecision(null);
    setNote('');
    setReason('');
    onOpenChange(false);
  };

  const approveMutation = useMutation({
    mutationFn: (adminNote: string) => adminApi.approveInstructor(applicationId!, adminNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      addToast({ title: 'Instructor approved', variant: 'success' });
      close();
    },
    onError: () => addToast({ title: 'Failed to approve application', variant: 'error' }),
  });

  const rejectMutation = useMutation({
    mutationFn: (rejectionReason: string) => adminApi.rejectInstructor(applicationId!, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
      addToast({ title: 'Instructor rejected', variant: 'success' });
      close();
    },
    onError: () => addToast({ title: 'Failed to reject application', variant: 'error' }),
  });

  const isPending = application?.status === 'pending';

  return (
    <>
      <Dialog open={!!applicationId} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" /> Review Application
            </DialogTitle>
            <DialogDescription>Applicant details and supporting documents</DialogDescription>
          </DialogHeader>

          {isLoading && (
            <div className="mt-4 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {isError && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="text-sm font-medium text-destructive">Failed to load application details</p>
              {error instanceof Error && <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>}
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {application && !isLoading && (
            <div className="mt-4 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={application.photo?.url} alt={application.fullName} />
                  <AvatarFallback>
                    <UserRound className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold">{application.fullName}</h2>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{application.email}</span>
                    <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{application.phone}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{application.address}</span>
                  </div>
                </div>
                <Badge variant={application.status === 'approved' ? 'success' : application.status === 'rejected' ? 'destructive' : 'warning'}>
                  {application.status}
                </Badge>
              </div>

              <Section title="Professional Background" icon={GraduationCap}>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Qualification" value={application.qualification} />
                  <DetailRow label="Experience" value={application.experience} />
                </dl>
                {application.bio && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bio</p>
                    <p className="mt-1 whitespace-pre-line text-sm">{application.bio}</p>
                  </div>
                )}
              </Section>

              <Separator />

              <Section title="Teaching" icon={Video}>
                {application.teachingCategories?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {application.teachingCategories.map((cat) => (
                      <Badge key={cat} variant="secondary">{cat}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No teaching categories provided</p>
                )}
                {application.demoVideo?.url && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">Demo video:</span>
                    <Button asChild variant="outline" size="sm">
                      <a href={application.demoVideo.url} target="_blank" rel="noreferrer">
                        <Video className="mr-1.5 h-3.5 w-3.5" /> Watch demo video
                      </a>
                    </Button>
                  </div>
                )}
              </Section>

              <Separator />

              <Section title="Verification Documents" icon={ShieldCheck}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Resume</p>
                    <FileLink url={application.resume?.url} label="Resume" />
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Identity proof</p>
                    <FileLink url={application.identityProof?.url} label="Identity proof" />
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Photo</p>
                    <FileLink url={application.photo?.url} label="Photo" />
                  </div>
                </div>
              </Section>

              <Separator />

              <Section title="Links" icon={Link2}>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="LinkedIn" value={application.linkedin ? <a className="text-primary underline" href={application.linkedin} target="_blank" rel="noreferrer">{application.linkedin}</a> : undefined} />
                  <DetailRow label="GitHub" value={application.github ? <a className="text-primary underline" href={application.github} target="_blank" rel="noreferrer">{application.github}</a> : undefined} />
                  <DetailRow label="Portfolio" value={application.portfolio ? <a className="text-primary underline" href={application.portfolio} target="_blank" rel="noreferrer">{application.portfolio}</a> : undefined} />
                  <DetailRow label="Website" value={application.website ? <a className="text-primary underline" href={application.website} target="_blank" rel="noreferrer">{application.website}</a> : undefined} />
                </dl>
              </Section>

              <Separator />

              <Section title="Financial Details" icon={CreditCard}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <Landmark className="h-3.5 w-3.5" /> Bank details
                    </p>
                    <dl className="space-y-2 text-sm">
                      <DetailRow label="Account holder" value={application.bankDetails?.accountHolderName} />
                      <DetailRow label="Account number" value={maskAccountNumber(application.bankDetails?.accountNumber)} />
                      <DetailRow label="IFSC" value={application.bankDetails?.ifscCode} />
                      <DetailRow label="Bank" value={application.bankDetails?.bankName} />
                      <DetailRow label="Branch" value={application.bankDetails?.branch} />
                      <DetailRow label="UPI ID" value={application.bankDetails?.upiId} />
                    </dl>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" /> Tax details
                    </p>
                    <dl className="space-y-2 text-sm">
                      <DetailRow label="PAN" value={application.taxDetails?.pan} />
                      <DetailRow label="GST" value={application.taxDetails?.gst} />
                    </dl>
                  </div>
                </div>
              </Section>

              <Separator />

              <Section title="Application Details" icon={FileText}>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Submitted on" value={formatDate(application.createdAt)} />
                  <DetailRow label="Last updated" value={formatDate(application.updatedAt)} />
                  <DetailRow label="Reviewed by" value={application.reviewedBy?.name || '—'} />
                  <DetailRow label="Reviewed on" value={formatDate(application.reviewedAt)} />
                </dl>
                {application.adminNote && <DetailRow label="Admin note" value={application.adminNote} />}
                {application.rejectionReason && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-destructive">Rejection reason</p>
                    <p className="mt-1 whitespace-pre-line text-sm">{application.rejectionReason}</p>
                  </div>
                )}
              </Section>

              <DialogFooter className="sm:justify-stretch">
                <div className="flex w-full gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => setDecision('approve')}
                    disabled={!isPending || approveMutation.isPending}
                    loading={approveMutation.isPending}
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive"
                    onClick={() => setDecision('reject')}
                    disabled={!isPending || rejectMutation.isPending}
                    loading={rejectMutation.isPending}
                  >
                    <XCircle className="mr-1.5 h-4 w-4" /> Reject
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        <Dialog open={decision === 'approve'} onOpenChange={(open) => !open && setDecision(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve application</DialogTitle>
              <DialogDescription>
                The applicant will be promoted to instructor and notified. Add an optional internal note.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="approve-note">Admin note (optional)</Label>
              <Textarea
                id="approve-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Verified qualification and identity documents"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDecision(null)}>Cancel</Button>
              <Button onClick={() => approveMutation.mutate(note.trim())} loading={approveMutation.isPending}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={decision === 'reject'} onOpenChange={(open) => !open && setDecision(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject application</DialogTitle>
              <DialogDescription>
                A rejection reason is required. The applicant will be notified with this reason.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection reason</Label>
              <Textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Required teaching qualification was not provided"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">This reason will be shared with the applicant.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDecision(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => rejectMutation.mutate(reason.trim())}
                disabled={!reason.trim()}
                loading={rejectMutation.isPending}
              >
                <XCircle className="mr-1.5 h-4 w-4" /> Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </DialogContent>
      </Dialog>
    </>
  );
}
