import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AssignmentFileUploader } from './AssignmentFileUploader';
import { ASSIGNMENT_CONTENT_LIMIT } from './assignment-utils';
import type { AssignmentFile } from '@/types/student';
import { RotateCcw, Send, Upload } from 'lucide-react';

interface AssignmentSubmissionFormProps {
  content: string;
  onContentChange: (value: string) => void;
  files: AssignmentFile[];
  onRemoveFile: (publicId: string) => void;
  pendingFile: File | null;
  onFileSelect: (file: File | null) => void;
  uploading: boolean;
  uploadProgress: number;
  isSubmitting: boolean;
  isResubmission: boolean;
  onSubmit: () => void;
}

export function AssignmentSubmissionForm({
  content,
  onContentChange,
  files,
  onRemoveFile,
  pendingFile,
  onFileSelect,
  uploading,
  uploadProgress,
  isSubmitting,
  isResubmission,
  onSubmit,
}: AssignmentSubmissionFormProps) {
  const disabled = isSubmitting || (!content.trim() && files.length === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {isResubmission ? (
            <>
              <RotateCcw className="h-4 w-4 text-primary" aria-hidden="true" />
              Resubmit Assignment
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 text-primary" aria-hidden="true" />
              Submit Assignment
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <label className="text-sm font-medium">Your Answer</label>
            <span
              className={`text-xs tabular-nums ${
                content.length > ASSIGNMENT_CONTENT_LIMIT ? 'font-semibold text-destructive' : 'text-muted-foreground'
              }`}
            >
              {content.length}/{ASSIGNMENT_CONTENT_LIMIT}
            </span>
          </div>
          <Textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Write your assignment answer..."
            rows={6}
            maxLength={ASSIGNMENT_CONTENT_LIMIT}
          />
        </div>

        <AssignmentFileUploader
          value={pendingFile}
          onChange={onFileSelect}
          files={files}
          uploading={uploading}
          progress={uploadProgress}
          onRemove={onRemoveFile}
        />

        <Button onClick={onSubmit} disabled={disabled} loading={isSubmitting} className="gap-2" fullWidth>
          {!isSubmitting && <Send className="h-4 w-4" aria-hidden="true" />}
          {isResubmission ? 'Resubmit' : 'Submit Assignment'}
        </Button>
      </CardContent>
    </Card>
  );
}