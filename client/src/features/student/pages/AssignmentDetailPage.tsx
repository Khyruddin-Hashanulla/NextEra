import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/providers/ToastProvider';
import { AssignmentDetailSkeleton } from '@/features/student/assignments/AssignmentDetailSkeleton';
import { AssignmentHero } from '@/features/student/assignments/AssignmentHero';
import { AssignmentMetadata } from '@/features/student/assignments/AssignmentMetadata';
import { AssignmentGradeCard } from '@/features/student/assignments/AssignmentGradeCard';
import { AssignmentSubmissionSummary } from '@/features/student/assignments/AssignmentSubmissionSummary';
import { AssignmentSubmissionForm } from '@/features/student/assignments/AssignmentSubmissionForm';
import type { AssignmentFile } from '@/types/student';
import { ArrowLeft, FileText } from 'lucide-react';

export function AssignmentDetailPage() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<AssignmentFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['student', 'assignment', lectureId],
    queryFn: ({ signal }) => studentApi.getAssignmentDetail(lectureId!, signal).then((r) => r.data.data),
    enabled: !!lectureId,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      studentApi.submitAssignment({
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
    return <AssignmentDetailSkeleton />;
  }

  const { lecture, status, submission, canSubmit } = data;
  const assignment = lecture.assignment;

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const res = await studentApi.uploadAssignmentFile(file, (percent) => setUploadProgress(percent));
      const uploaded = res.data.data;
      setFiles((prev) => [...prev.slice(-4), uploaded]);
      setPendingFile(null);
      addToast({ title: 'File uploaded', variant: 'success' });
    } catch {
      addToast({ title: 'File upload failed', variant: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (file: File | null) => {
    setPendingFile(file);
    if (file) handleUpload(file);
  };

  const removeFile = (publicId: string) => {
    setFiles((prev) => prev.filter((f) => f.publicId !== publicId));
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Link
        to="/student/assignments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Assignments
      </Link>

      <AssignmentHero lecture={lecture} status={status} />

      {assignment?.instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">
              {assignment.instructions}
            </p>
          </CardContent>
        </Card>
      )}

      <AssignmentMetadata assignment={assignment} />

      {submission && <AssignmentGradeCard submission={submission} />}

      {submission && <AssignmentSubmissionSummary submission={submission} />}

      {canSubmit && (
        <AssignmentSubmissionForm
          content={content}
          onContentChange={setContent}
          files={files}
          onRemoveFile={removeFile}
          pendingFile={pendingFile}
          onFileSelect={handleFileSelect}
          uploading={uploading}
          uploadProgress={uploadProgress}
          isSubmitting={submitMutation.isPending}
          isResubmission={submission?.status === 'returned_for_resubmission'}
          onSubmit={() => submitMutation.mutate()}
        />
      )}
    </div>
  );
}