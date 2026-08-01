import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/providers/ToastProvider';
import { FormSkeleton } from '@/components/skeletons/FormSkeleton';
import { FileUpload } from '@/components/ui/file-upload';
import type { InstructorSubmissionDetail, InstructorAssignmentStatus } from '@/types/instructor';
import {
  ArrowLeft, Download, Loader2, FileText, Send, Save,
  RotateCcw, CheckCircle, XCircle,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-yellow-50 text-yellow-700',
  late_submission: 'bg-orange-50 text-orange-700',
  under_review: 'bg-purple-50 text-purple-700',
  graded: 'bg-green-50 text-green-700',
  returned_for_resubmission: 'bg-pink-50 text-pink-700',
  rejected: 'bg-red-50 text-red-700',
};

const ACCEPT = '.pdf,.doc,.docx,.zip,.rar,.txt,.md,.c,.cpp,.js,.jsx,.ts,.tsx,.py,.java,.jpeg,.jpg,.png,.webp';

export function SubmissionDetailPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [grade, setGrade] = useState('');
  const [maxMarks, setMaxMarks] = useState('');
  const [letterGrade, setLetterGrade] = useState('');
  const [customScale, setCustomScale] = useState('');
  const [feedback, setFeedback] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [gradedFiles, setGradedFiles] = useState<{ url: string; publicId: string; name: string }[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [returnFeedback, setReturnFeedback] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'assignment', 'submission', submissionId],
    queryFn: ({ signal }) => instructorApi.getSubmissionDetail(submissionId!, signal).then((r) => r.data.data),
    enabled: !!submissionId,
  });

  const submission: InstructorSubmissionDetail | undefined = data;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['instructor', 'assignment', 'submission', submissionId] });
    queryClient.invalidateQueries({ queryKey: ['instructor', 'assignments'] });
  };

  const gradeMutation = useMutation({
    mutationFn: (publish: boolean) => instructorApi.gradeSubmission(submissionId!, {
      grade: parseFloat(grade),
      maxMarks: maxMarks ? parseFloat(maxMarks) : undefined,
      letterGrade: letterGrade || undefined,
      customGradeScale: customScale || undefined,
      feedback: feedback || undefined,
      privateNotes: privateNotes || undefined,
      gradedFiles: gradedFiles.length ? gradedFiles : undefined,
      publish,
    }),
    onSuccess: () => {
      invalidate();
      addToast({ title: 'Grade saved', variant: 'success' });
      setGrade(''); setMaxMarks(''); setLetterGrade(''); setCustomScale(''); setFeedback(''); setPrivateNotes(''); setGradedFiles([]);
    },
    onError: () => addToast({ title: 'Failed to save grade', variant: 'error' }),
  });

  const returnMutation = useMutation({
    mutationFn: () => instructorApi.returnForResubmission(submissionId!, { feedback: returnFeedback || undefined }),
    onSuccess: () => {
      invalidate();
      setReturnFeedback('');
      addToast({ title: 'Returned for resubmission', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to return', variant: 'error' }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => instructorApi.updateSubmissionStatus(submissionId!, { status: 'rejected' }),
    onSuccess: () => {
      invalidate();
      addToast({ title: 'Submission rejected', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to reject', variant: 'error' }),
  });

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await studentUpload(file);
      setGradedFiles((prev) => [...prev.slice(-4), res]);
      addToast({ title: 'File uploaded', variant: 'success' });
    } catch {
      addToast({ title: 'File upload failed', variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const canGrade = ['submitted', 'late_submission', 'under_review', 'graded', 'returned_for_resubmission'].includes(submission?.status || '');
  const isBusy = gradeMutation.isPending || returnMutation.isPending || rejectMutation.isPending;

  if (isLoading || !submission) {
    return <FormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/instructor/assignments/${(submission.lecture as any)?._id || ''}/submissions`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Submissions
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{submission.user?.name || 'Student'}</h1>
        <p className="text-sm text-muted-foreground">{submission.user?.email}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className={STATUS_STYLES[submission.status] || ''}>{submission.status.replace(/_/g, ' ')}</Badge>
        {submission.submissionVersion > 1 && <Badge variant="secondary">Version {submission.submissionVersion}</Badge>}
        {submission.lateSubmission && <Badge variant="warning">Late{submission.penaltyPercent > 0 ? ` · ${submission.penaltyPercent}% penalty` : ''}</Badge>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Submission</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Submitted {new Date(submission.submittedAt).toLocaleString()}</p>
              {submission.content && <p className="whitespace-pre-line text-sm">{submission.content}</p>}
              {submission.files?.length > 0 && (
                <div className="space-y-2">
                  {submission.files.map((f: any) => (
                    <div key={f.publicId} className="flex items-center justify-between rounded-lg border p-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm">{f.name}</span>
                      </div>
                      <a href={f.url} target="_blank" rel="noopener noreferrer" download>
                        <Button variant="ghost" size="sm"><Download className="h-3 w-3" /></Button>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {(submission.grade !== undefined || submission.letterGrade) && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Current Grade</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-bold">{submission.letterGrade || `${submission.grade}/${submission.maxMarks || 100}`}</span>
                  {submission.percentage !== undefined && <Badge variant="secondary">{submission.percentage}%</Badge>}
                  {submission.passFail && (
                    <span className={`flex items-center gap-1 text-sm font-medium ${submission.passFail === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                      {submission.passFail === 'pass' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {submission.passFail === 'pass' ? 'Pass' : 'Fail'}
                    </span>
                  )}
                </div>
                {submission.feedback && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm font-medium">Feedback</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{submission.feedback}</p>
                  </div>
                )}
                {submission.publishedAt && (
                  <p className="text-xs text-muted-foreground">Published {new Date(submission.publishedAt).toLocaleString()}</p>
                )}
              </CardContent>
            </Card>
          )}

          {submission.gradingHistory && submission.gradingHistory.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Grading History</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[...submission.gradingHistory].reverse().map((h, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{h.letterGrade} · {h.percentage}%</span>
                      <span className="text-xs text-muted-foreground">{new Date(h.gradedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      By {typeof h.gradedBy === 'object' ? h.gradedBy?.name || 'Instructor' : 'Instructor'} · {h.status.replace(/_/g, ' ')}
                    </p>
                    {h.feedback && <p className="mt-1 text-sm text-muted-foreground">{h.feedback}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {canGrade && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Grade Submission</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Marks Obtained *</label>
                  <Input type="number" min={0} value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 85" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Marks</label>
                  <Input type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} placeholder={String((submission as any)?.lecture?.assignment?.totalMarks || 100)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Letter Grade (optional)</label>
                  <Input value={letterGrade} onChange={(e) => setLetterGrade(e.target.value)} placeholder="e.g. A+" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Grade Scale Label (optional)</label>
                  <Input value={customScale} onChange={(e) => setCustomScale(e.target.value)} placeholder="e.g. Excellent" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Feedback (visible to student)</label>
                <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} placeholder="Provide feedback to the student..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Private Notes (instructor only)</label>
                <Textarea value={privateNotes} onChange={(e) => setPrivateNotes(e.target.value)} rows={3} placeholder="Internal notes..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Attach Reviewed Files</label>
                <FileUpload
                  accept={ACCEPT}
                  maxSize={25 * 1024 * 1024}
                  label="Upload reviewed files"
                  value={pendingFile}
                  onChange={(f) => { setPendingFile(f); if (f) handleUpload(f); }}
                  disabled={uploading || gradedFiles.length >= 5}
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {gradedFiles.length > 0 && (
                  <div className="space-y-2">
                    {gradedFiles.map((f) => (
                      <div key={f.publicId} className="flex items-center justify-between rounded-lg border p-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate text-sm">{f.name}</span>
                        </div>
                        <button onClick={() => setGradedFiles((prev) => prev.filter((x) => x.publicId !== f.publicId))} className="text-xs text-destructive hover:underline">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => gradeMutation.mutate(false)} disabled={!grade || isBusy} variant="outline">
                  {gradeMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                  Save Draft
                </Button>
                <Button onClick={() => gradeMutation.mutate(true)} disabled={!grade || isBusy}>
                  {gradeMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
                  Publish Grade
                </Button>
                <Button onClick={() => returnMutation.mutate()} disabled={isBusy} variant="secondary">
                  <RotateCcw className="mr-1 h-4 w-4" /> Return
                </Button>
                <Button onClick={() => rejectMutation.mutate()} disabled={isBusy} variant="destructive">
                  <XCircle className="mr-1 h-4 w-4" /> Reject
                </Button>
              </div>

              <div className="space-y-2 border-t pt-4">
                <label className="text-sm font-medium">Feedback for Return</label>
                <Textarea value={returnFeedback} onChange={(e) => setReturnFeedback(e.target.value)} rows={2} placeholder="Notes on what needs to change before resubmission..." />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

async function studentUpload(file: File): Promise<{ url: string; publicId: string; name: string }> {
  const { studentApi } = await import('@/api/endpoints/student');
  const res = await studentApi.uploadAssignmentFile(file);
  return res.data.data;
}
