import { useState, useRef, useCallback, DragEvent } from 'react';
import { Upload, X, File as FileIcon, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export interface FileUploadResult {
  url: string;
  publicId: string;
  name?: string;
}

interface FileUploaderProps {
  accept: string;
  maxSize: number;
  label: string;
  hint?: string;
  value?: FileUploadResult | null;
  onChange: (file: FileUploadResult | null) => void;
  upload: (file: File, onProgress: (percent: number) => void) => Promise<FileUploadResult>;
  disabled?: boolean;
  compact?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${value} ${sizes[i]}`;
}

export function FileUploader({ accept, maxSize, label, hint, value, onChange, upload, disabled, compact }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setError(null);

      const ext = file.name.toLowerCase().split('.').pop();
      const acceptedExts = accept.split(',').map((a) => a.trim().toLowerCase());
      if (ext && !acceptedExts.some((a) => a === `.${ext}` || a === ext)) {
        setError(`Invalid file type. Accepted: ${accept}`);
        return;
      }
      if (file.size > maxSize) {
        setError(`File is too large. Maximum: ${formatSize(maxSize)}`);
        return;
      }
      if (file.size === 0) {
        setError('File is empty');
        return;
      }

      setIsUploading(true);
      setProgress(0);
      try {
        const result = await upload(file, (p) => setProgress(p));
        onChange(result);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
        setProgress(null);
      }
    },
    [accept, maxSize, upload, onChange]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setError(null);
    onChange(null);
  }, [onChange]);

  if (value?.url && !isUploading) {
    return (
      <div className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${compact ? 'px-3 py-2' : ''}`}>
        <div className="flex min-w-0 items-center gap-3">
          <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{value.name || 'Uploaded file'}</p>
            <a href={value.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View file</a>
          </div>
        </div>
        {!disabled && (
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isUploading) inputRef.current?.click(); }}
        className={`
          relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors
          ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}
          ${disabled || isUploading ? 'cursor-not-allowed opacity-60' : ''}
          ${error ? 'border-destructive' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled || isUploading}
          onChange={(e) => { handleFile(e.target.files?.[0] || null); if (e.target) e.target.value = ''; }}
          className="hidden"
        />
        {isUploading ? (
          <>
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Uploading…</p>
            {progress !== null && (
              <div className="mt-2 w-full max-w-[200px]">
                <Progress value={progress} />
                <p className="mt-1 text-center text-xs text-muted-foreground">{progress}%</p>
              </div>
            )}
          </>
        ) : error ? (
          <>
            <AlertCircle className="mb-2 h-8 w-8 text-destructive" />
            <p className="text-sm font-medium">{error}</p>
          </>
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">Drag & drop or click to browse</p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            <p className="text-xs text-muted-foreground">Accepted: {accept} (max {formatSize(maxSize)})</p>
          </>
        )}
      </div>
    </div>
  );
}

export { CheckCircle2 };
