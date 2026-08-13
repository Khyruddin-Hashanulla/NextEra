import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { CalendarClock, Loader2, FileText, Download, Trophy, FileCheck } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { studentApi } from '@/api/endpoints/student';

interface AssignmentTabProps {
  courseId: string;
  lectureId: string;
}

type UploadedFile = { url: string; publicId: string; name: string };

export function AssignmentTab({ courseId, lectureId }: AssignmentTabProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { data: detail } = useQuery({
    queryKey: ['student', 'assignment', lectureId],
    queryFn: () => studentApi.getAssignmentDetail(lectureId).then((r: any) => r.data.data),
    enabled: !!lectureId,
  });

  const assignment = detail?.lecture?.assignment;
  const dueDate = assignment?.dueDate ? new Date(assignment.dueDate) : null;

  const submission = detail?.submission || null;
  const canSubmit = detail?.canSubmit;

  const submitMutation = useMutation({
    mutationFn: () =>
      studentApi.submitAssignment({ courseId, lectureId, content, files: files.length ? files : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'assignment', lectureId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'assignments', 'overview'] });
      setContent('');
      setFiles([]);
      addToast({ title: 'Assignment submitted', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to submit assignment', variant: 'error' }),
  });

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await studentApi.uploadAssignmentFile(file);
      setFiles((prev) => [...prev.slice(-4), res.data.data]);
      addToast({ title: 'File uploaded', variant: 'success' });
    } catch {
      addToast({ title: 'File upload failed', variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  if (submission) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-sm font-medium">Status: {submission.status.replace(/_/g, ' ')}</p>
            {(submission.grade !== undefined || submission.letterGrade) && (
              <p className="text-sm">
                Grade: {submission.letterGrade || `${submission.grade}/${submission.maxMarks || 100}`}
                {submission.percentage !== undefined && ` (${submission.percentage}%)`}
              </p>
            )}
            {submission.passFail && (
              <p
                className={`text-sm font-medium ${submission.passFail === 'pass' ? 'text-success' : 'text-destructive'}`}
              >
                {submission.passFail === 'pass' ? 'Passed' : 'Failed'}
              </p>
            )}
            {submission.feedback && <p className="text-sm">Feedback: {submission.feedback}</p>}
            {submission.lateSubmission && submission.penaltyPercent > 0 && (
              <p className="text-xs text-warning">Late submission · {submission.penaltyPercent}% penalty</p>
            )}
          </div>
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
                    <Button variant="ghost" size="sm">
                      <Download className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!canSubmit) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Submission not available.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {assignment?.question && <p className="whitespace-pre-line text-sm leading-relaxed">{assignment.question}</p>}
        {assignment?.instructions && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Instructions</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{assignment.instructions}</p>
          </div>
        )}
        {assignment && (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
              Total marks: {assignment.totalMarks ?? '—'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <FileCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Passing marks: {assignment.passingMarks ?? '—'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              Due: {dueDate ? dueDate.toLocaleDateString() : 'No deadline'}
            </span>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="space-y-3 pt-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your assignment answer..."
            rows={6}
          />
          <FileUpload
            accept=".pdf,.doc,.docx,.zip,.rar,.txt,.md,.c,.cpp,.js,.jsx,.ts,.tsx,.py,.java,.jpeg,.jpg,.png,.webp"
            maxSize={25 * 1024 * 1024}
            label="Upload assignment files (max 5)"
            value={pendingFile}
            onChange={(f) => {
              setPendingFile(f);
              if (f) handleUpload(f);
            }}
            disabled={uploading || files.length >= 5}
          />
          {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.publicId} className="flex items-center justify-between rounded-lg border p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{f.name}</span>
                  </div>
                  <button
                    onClick={() => setFiles((prev) => prev.filter((x) => x.publicId !== f.publicId))}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || (!content.trim() && files.length === 0)}
          >
            {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Assignment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
