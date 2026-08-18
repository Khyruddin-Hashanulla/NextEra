import { FileUpload } from '@/components/ui/file-upload';
import { Progress } from '@/components/ui/progress';
import type { AssignmentFile } from '@/types/student';
import {
  ASSIGNMENT_ACCEPT,
  ASSIGNMENT_MAX_FILES,
  ASSIGNMENT_MAX_SIZE,
} from './assignment-utils';
import { FileText, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignmentFileUploaderProps {
  value: File | null;
  onChange: (file: File | null) => void;
  files: AssignmentFile[];
  uploading: boolean;
  progress: number;
  onRemove: (publicId: string) => void;
}

export function AssignmentFileUploader({ value, onChange, files, uploading, progress, onRemove }: AssignmentFileUploaderProps) {
  const atLimit = files.length >= ASSIGNMENT_MAX_FILES;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <label className="text-sm font-medium">Attachments (max {ASSIGNMENT_MAX_FILES})</label>
        <span className="text-xs text-muted-foreground">{files.length}/{ASSIGNMENT_MAX_FILES} uploaded</span>
      </div>

      <FileUpload
        accept={ASSIGNMENT_ACCEPT}
        maxSize={ASSIGNMENT_MAX_SIZE}
        label="Upload assignment files"
        value={value}
        onChange={onChange}
        disabled={uploading || atLimit}
      />

      {uploading && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Uploading file…</span>
            <span className="tabular-nums">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.publicId} className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate text-sm">{f.name}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(f.publicId)}
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium text-destructive transition-colors hover:text-destructive/80'
                )}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}