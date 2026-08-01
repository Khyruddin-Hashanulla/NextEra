import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/providers/ToastProvider';
import { FormSkeleton } from '@/components/skeletons/FormSkeleton';
import {
  ArrowLeft, Download, Loader2, FileText, Save,
  CheckCircle, XCircle,
} from 'lucide-react';

export function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [grade, setGrade] = useState('');
  const [maxMarks, setMaxMarks] = useState('');
  const [letterGrade, setLetterGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'assignment', id],
    queryFn: ({ signal }) => adminApi.getAssignmentSubmission(id!, signal).then((r) => r.data.data),
    enabled: !!id,
  });

  const submission = data;

  const overrideMutation = useMutation({
    mutationFn: () => adminApi.overrideGrade(id!, {
      grade: parseFloat(grade),
      maxMarks: maxMarks ? parseFloat(maxMarks) : undefined,
      letterGrade: letterGrade || undefined,
      feedback: feedback || undefined,
      privateNotes: privateNotes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'assignment', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'assignments'] });
      setGrade(''); setMaxMarks(''); setLetterGrade(''); setFeedback(''); setPrivateNotes('');
      addToast({ title: 'Grade overridden', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to override grade', variant: 'error' }),
  });

  if (isLoading || !submission) {
    return <FormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/assignments" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Assignments
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{submission.user?.name || 'Student'}</h1>
        <p className="text-sm text-muted-foreground">{submission.user?.email}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge>{submission.status.replace(/_/g, ' ')}</Badge>
        {submission.submissionVersion > 1 && <Badge variant="secondary">Version {submission.submissionVersion}</Badge>}
        {submission.lateSubmission && <Badge variant="warning">Late</Badge>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="space-y-1 pt-6">
            <p className="text-xs text-muted-foreground">Course</p>
            <p className="text-sm font-medium">{submission.course?.title || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <p className="text-xs text-muted-foreground">Assignment</p>
            <p className="text-sm font-medium">{submission.lecture?.title || '-'}</p>
          </CardContent>
        </Card>
      </div>

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
            {submission.feedback && <p className="whitespace-pre-line text-sm text-muted-foreground">{submission.feedback}</p>}
            {submission.publishedAt && <p className="text-xs text-muted-foreground">Published {new Date(submission.publishedAt).toLocaleString()}</p>}
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
                  By {h.gradedBy?.name || 'Instructor'} · {h.status.replace(/_/g, ' ')}
                </p>
                {h.feedback && <p className="mt-1 text-sm text-muted-foreground">{h.feedback}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Override Grade</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Marks Obtained *</label>
              <Input type="number" min={0} value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 85" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Marks</label>
              <Input type="number" min={1} value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} placeholder={String(submission.maxMarks || 100)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Letter Grade (optional)</label>
              <Input value={letterGrade} onChange={(e) => setLetterGrade(e.target.value)} placeholder="e.g. A+" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Feedback</label>
            <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} placeholder="Feedback to student..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Notes</label>
            <Textarea value={privateNotes} onChange={(e) => setPrivateNotes(e.target.value)} rows={2} placeholder="Internal admin notes..." />
          </div>
          <Button onClick={() => overrideMutation.mutate()} disabled={!grade || overrideMutation.isPending}>
            {overrideMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Override Grade
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
