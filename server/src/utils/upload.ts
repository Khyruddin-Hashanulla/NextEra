import path from 'path';
import crypto from 'crypto';
import { FileCategory, UPLOAD_POLICIES, UploadPolicy, EXECUTABLE_EXTENSIONS, DANGEROUS_PATTERNS } from '../config/upload';
import { ApiError } from './ApiError';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

function getExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (!ext) {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.slice(lastDot).toLowerCase();
  }
  return ext;
}

function hasExecutableExtension(extension: string): boolean {
  return EXECUTABLE_EXTENSIONS.has(extension);
}

function matchesDangerousPattern(filename: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(filename));
}

function isValidObjectId(str: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(str);
}

export function sanitizeFilename(filename: string): string {
  let safe = filename
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/\.\.\//g, '')
    .replace(/\.\.\\/g, '')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .trim();

  if (safe.startsWith('.')) safe = '_' + safe;
  if (safe.length === 0) safe = 'untitled';
  if (safe.length > 255) safe = safe.slice(0, 255);

  return safe;
}

export function generateSafeFilename(originalname: string): string {
  const ext = getExtension(originalname);
  const randomId = crypto.randomBytes(8).toString('hex');
  const base = path.basename(originalname, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 50);
  return `${base}_${randomId}${ext}`;
}

export function validateMimeType(mimeType: string, policy: UploadPolicy): boolean {
  return policy.allowedMimeTypes.includes(mimeType as any);
}

export function validateExtension(filename: string, policy: UploadPolicy): boolean {
  const ext = getExtension(filename);
  return policy.allowedExtensions.includes(ext as any);
}

export function validateFileSize(size: number, policy: UploadPolicy): boolean {
  return size > 0 && size <= policy.maxSize;
}

export function validateFilename(filename: string): ValidationResult {
  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: 'Filename is required' };
  }

  if (filename.length > 512) {
    return { valid: false, error: 'Filename is too long' };
  }

  const ext = getExtension(filename);

  if (hasExecutableExtension(ext)) {
    return { valid: false, error: `Executable files are not allowed (${ext})` };
  }

  if (matchesDangerousPattern(filename)) {
    return { valid: false, error: 'File type is not allowed' };
  }

  if (filename.includes('\0')) {
    return { valid: false, error: 'Filename contains null bytes' };
  }

  if (filename.startsWith('.')) {
    return { valid: false, error: 'Hidden files are not allowed' };
  }

  if (/^\.{2,}/.test(filename)) {
    return { valid: false, error: 'Invalid filename' };
  }

  const sanitized = sanitizeFilename(filename);
  return { valid: true, sanitizedFilename: sanitized };
}

export function validateCloudinaryResponse(result: any): { url: string; publicId: string } {
  if (!result) {
    throw ApiError.internal('Cloudinary returned empty response');
  }

  const secureUrl = result.secure_url || result.url;
  if (!secureUrl || typeof secureUrl !== 'string') {
    throw ApiError.internal('Cloudinary returned invalid URL');
  }

  if (!secureUrl.startsWith('https://')) {
    throw ApiError.internal('Cloudinary returned non-HTTPS URL');
  }

  const publicId = result.public_id;
  if (!publicId || typeof publicId !== 'string') {
    throw ApiError.internal('Cloudinary returned invalid public ID');
  }

  const expectedResourceType = result.resource_type;
  if (expectedResourceType && !['image', 'video', 'raw'].includes(expectedResourceType)) {
    throw ApiError.internal('Cloudinary returned unexpected resource type');
  }

  const expectedFormat = result.format;
  if (expectedFormat && /(exe|bat|cmd|dll|js|php|html)$/i.test(expectedFormat)) {
    throw ApiError.internal('Cloudinary returned suspicious file format');
  }

  return { url: secureUrl, publicId };
}

export function validateUploadedFile(
  file: Express.Multer.File | undefined,
  policy: UploadPolicy,
): void {
  if (!file) {
    throw ApiError.badRequest('No file provided');
  }

  if (file.size === 0) {
    throw ApiError.badRequest('File is empty');
  }

  if (file.size > policy.maxSize) {
    const maxMB = Math.round(policy.maxSize / (1024 * 1024));
    throw ApiError.badRequest(`File size must not exceed ${maxMB}MB`);
  }

  const mimeResult = validateMimeType(file.mimetype, policy);
  if (!mimeResult) {
    const allowedTypes = policy.allowedExtensions.join(', ');
    throw ApiError.badRequest(`Invalid file type. Allowed: ${allowedTypes}`);
  }

  const extResult = validateExtension(file.originalname, policy);
  if (!extResult) {
    const allowedTypes = policy.allowedExtensions.join(', ');
    throw ApiError.badRequest(`Invalid file extension. Allowed: ${allowedTypes}`);
  }

  const filenameResult = validateFilename(file.originalname);
  if (!filenameResult.valid) {
    throw ApiError.badRequest(filenameResult.error || 'Invalid filename');
  }
}

export function getPolicyForCategory(category: FileCategory): UploadPolicy {
  const policy = UPLOAD_POLICIES[category];
  if (!policy) {
    throw ApiError.internal(`Unknown upload category: ${category}`);
  }
  return policy;
}

export function getPolicyForMimeType(mimeType: string): UploadPolicy | null {
  for (const policy of Object.values(UPLOAD_POLICIES)) {
    if (policy.allowedMimeTypes.includes(mimeType as any)) {
      return policy;
    }
  }
  return null;
}

export { FileCategory } from '../config/upload';
