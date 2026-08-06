import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/providers/ToastProvider';
import { FormSkeleton } from '@/components/skeletons/FormSkeleton';
import { FileUpload } from '@/components/ui/file-upload';
import type { AssignmentFile, AssignmentStatus } from '@/types/student';
import {
  ArrowLeft, Download, Upload, Loader2, File as FileIcon,
  CheckCircle, XCircle, Clock, RotateCcw,
} from 'lucide-react';

const STATUS_STYLES: Record<AssignmentStatus, { label: string; className: string }> = {
  assigned: { label: 'Assigned', className: 'bg-blue-50 text-blue-700' },
  overdue: { label: 'Overdue', className: 'bg-red-50 text-red-700' },
  submitted: { label: 'Submitted', className: 'bg-yellow-50 text-yellow-700' },
  late_submission: { label: 'Late Submission', className: 'bg-orange-50 text-orange-700' },
  under_review: { label: 'Under Review', className: 'bg-purple-50 text-purple-700' },
  graded: { label: 'Graded', className: 'bg-green-50 text-green-700' },
  returned_for_resubmission: { label: 'Needs Revision', className: 'bg-pink-50 text-pink-700' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700' },
};

const ACCEPT = '.pdf,.doc,.docx,.zip,.rar,.txt,.md,.c,.cpp,.js,.jsx,.ts,.tsx,.py,.java,.jpeg,.jpg,.png,.webp';

export function AssignmentDetailPage() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<AssignmentFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'assignment', lectureId],
    queryFn: ({ signal }) => studentApi.getAssignmentDetail(lectureId!, signal).then((r) => r.data.data),
    enabled: !!lectureId,
  });

  const submitMutation = useMutation({
    mutationFn: () => studentApi.submitAssignment({
      courseId: data!.lecture.course._id,
      lectureId: lectureId!,
      content,
      files: files.length ? files : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'assignment', lectureId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'assignments', 'overview'] });
      setContent('');
      setFiles([]);
      addToast({ title: 'Assignment submitted', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to submit assignment', variant: 'error' }),
  });

  if (isLoading || !data) {
    return <FormSkeleton />;
  }

  const { lecture, status, submission, canSubmit } = data;
  const assignment = lecture.assignment;

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await studentApi.uploadAssignmentFile(file);
      const uploaded = res.data.data;
      setFiles((prev) => [...prev.slice(-4), uploaded]);
      addToast({ title: 'File uploaded', variant: 'success' });
    } catch {
      addToast({ title: 'File upload failed', variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (file: File | null) => {
    setPendingFile(file);
    if (file) handleUpload(file);
  };

  const removeFile = (publicId: string) => {
    setFiles((prev) => prev.filter((f) => f.publicId !== publicId));
  };

  const gradeView = submission && (submission.grade !== undefined || submission.letterGrade);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/student/assignments" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Assignments
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{lecture.title}</h1>
          <p className="text-sm text-muted-foreground">{lecture.course.title}</p>
        </div>
        <Badge className={STATUS_STYLES[status]?.className}>{STATUS_STYLES[status]?.label}</Badge>
      </div>

      {assignment?.instructions && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Instructions</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{assignment.instructions}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">Max Marks</p>
            <p className="mt-1 text-xl font-bold">{assignment.totalMarks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">Passing Marks</p>
            <p className="mt-1 text-xl font-bold">{assignment.passingMarks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="mt-1 text-xl font-bold">
              {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No deadline'}
            </p>
          </CardContent>
        </Card>
      </div>

      {gradeView && submission && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Your Grade</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl font-bold">{submission.letterGrade || `${submission.grade}/${submission.maxMarks}`}</span>
              {submission.percentage !== undefined && <Badge variant="secondary">{submission.percentage}%</Badge>}
              {submission.passFail && (
                <span className={`inline-flex items-center gap-1 text-sm font-medium ${submission.passFail === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                  {submission.passFail === 'pass' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {submission.passFail === 'pass' ? 'Passed' : 'Failed'}
                </span>
              )}
            </div>
            {submission.feedback && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm font-medium">Feedback</p>
                <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{submission.feedback}</p>
              </div>
            )}
            {submission.lateSubmission && (
              <p className="flex items-center gap-1 text-xs text-orange-600">
                <Clock className="h-3 w-3" /> Late submission
                {submission.penaltyPercent > 0 && ` · ${submission.penaltyPercent}% penalty`}
              </p>
            )}
            {submission.gradedFiles && submission.gradedFiles.length > 0 && (
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">Reviewed Files</p>
                <div className="mt-2 space-y-2">
                  {submission.gradedFiles.map((f) => (
                    <div key={f.publicId} className="flex items-center justify-between rounded-lg border p-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm">{f.name}</span>
                      </div>
                      <a href={f.url} target="_blank" rel="noopener noreferrer" download>
                        <Button variant="ghost" size="sm"><Download className="h-3 w-3" /></Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {submission && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Your Submission</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Submitted: {new Date(submission.submittedAt).toLocaleString()}
              {submission.submissionVersion > 1 && ` · Version ${submission.submissionVersion}`}
            </p>
            {submission.content && <p className="whitespace-pre-line text-sm">{submission.content}</p>}
            {submission.files?.length > 0 && (
              <div className="space-y-2">
                {submission.files.map((f) => (
                  <div key={f.publicId} className="flex items-center justify-between rounded-lg border p-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
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
      )}

      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              {submission?.status === 'returned_for_resubmission' ? (
                <>
                  <RotateCcw className="h-4 w-4" /> Resubmit Assignment
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Submit Assignment
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Answer</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your assignment answer..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Attachments (max 5)</label>
              <FileUpload
                accept={ACCEPT}
                maxSize={25 * 1024 * 1024}
                label="Upload assignment files"
                value={pendingFile}
                onChange={handleFileSelect}
                disabled={uploading || files.length >= 5}
              />
              {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f) => (
                    <div key={f.publicId} className="flex items-center justify-between rounded-lg border p-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm">{f.name}</span>
                      </div>
                      <button onClick={() => removeFile(f.publicId)} className="text-xs text-destructive hover:underline">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || (!content.trim() && files.length === 0)}
            >
              {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {submission?.status === 'returned_for_resubmission' ? 'Resubmit' : 'Submit Assignment'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
