import { useState, useRef, useCallback, DragEvent } from 'react';
import { Upload, X, File as FileIcon, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';

interface FileUploadProps {
  accept: string;
  maxSize: number;
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  error?: string;
}

const MAX_FILENAME_LENGTH = 200;

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${value} ${sizes[i]}`;
}

function isValidExtension(filename: string, accept: string): boolean {
  if (!accept) return true;
  const ext = filename.toLowerCase().split('.').pop();
  if (!ext) return false;
  const acceptedExts = accept.split(',').map((a) => a.trim().toLowerCase());
  return acceptedExts.some((a) => a === `.${ext}` || a === ext);
}

function isValidMimeType(file: File, accept: string): boolean {
  if (!accept) return true;
  const acceptedTypes = accept.split(',').map((a) => a.trim());
  for (const t of acceptedTypes) {
    if (t === file.type) return true;
    if (t.endsWith('/*')) {
      const category = t.split('/')[0];
      if (file.type.startsWith(`${category}/`)) return true;
    }
  }
  return false;
}

export function FileUpload({ accept, maxSize, label, value, onChange, disabled, error: externalError }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const error = externalError || internalError;

  const validateFile = useCallback((file: File): string | null => {
    if (file.name.length > MAX_FILENAME_LENGTH) {
      return 'Filename is too long';
    }
    if (!isValidExtension(file.name, accept) || !isValidMimeType(file, accept)) {
      return `Invalid file type. Accepted: ${accept}`;
    }
    if (file.size > maxSize) {
      return `File is too large. Maximum: ${formatSize(maxSize)}`;
    }
    if (file.size === 0) {
      return 'File is empty';
    }
    return null;
  }, [accept, maxSize]);

  const handleFile = useCallback((file: File | null) => {
    setInternalError(null);
    if (!file) {
      setPreview(null);
      onChange(null);
      return;
    }
    const validationError = validateFile(file);
    if (validationError) {
      setInternalError(validationError);
      onChange(null);
      return;
    }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
    onChange(file);
  }, [validateFile, onChange]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
    if (e.target) e.target.value = '';
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    setInternalError(null);
    onChange(null);
  }, [onChange]);

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        className={`
          relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6
          transition-colors
          ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          ${error ? 'border-destructive' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
        {value && preview ? (
          <div className="relative">
            <OptimizedImage src={preview} alt="Uploaded image preview" className="max-h-40 rounded object-contain" lazy={false} />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : value ? (
          <div className="flex items-center gap-3">
            {value.type.startsWith('image/') ? (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            ) : (
              <FileIcon className="h-8 w-8 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{value.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(value.size)}</p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <>
            {error ? (
              <AlertCircle className="mb-2 h-8 w-8 text-destructive" />
            ) : (
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            )}
            <p className="text-sm font-medium">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Accepted: {accept} (max {formatSize(maxSize)})
            </p>
          </>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
