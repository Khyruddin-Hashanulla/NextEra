import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { FileCategory, UPLOAD_POLICIES, UploadPolicy } from '../config/upload';
import { validateFilename, validateExtension, validateMimeType } from '../utils/upload';

const storage = multer.memoryStorage();

function createFileFilter(policy: UploadPolicy) {
  return (_req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
    if (!validateMimeType(file.mimetype, policy)) {
      callback(new Error(`Invalid file type. Allowed: ${policy.allowedExtensions.join(', ')}`));
      return;
    }

    const extResult = validateExtension(file.originalname, policy);
    if (!extResult) {
      callback(new Error(`Invalid file extension. Allowed: ${policy.allowedExtensions.join(', ')}`));
      return;
    }

    const filenameResult = validateFilename(file.originalname);
    if (!filenameResult.valid) {
      callback(new Error(filenameResult.error || 'Invalid filename'));
      return;
    }

    callback(null, true);
  };
}

export function createUploadMiddleware(category: FileCategory) {
  const policy = UPLOAD_POLICIES[category];
  return multer({
    storage,
    limits: {
      fileSize: policy.maxSize,
      files: 1,
    },
    fileFilter: createFileFilter(policy),
  });
}

export function createMultiUploadMiddleware(category: FileCategory, maxFiles = 5) {
  const policy = UPLOAD_POLICIES[category];
  return multer({
    storage,
    limits: {
      fileSize: policy.maxSize,
      files: maxFiles,
    },
    fileFilter: createFileFilter(policy),
  });
}

export function createFieldUploadMiddleware(
  fields: { name: string; category: FileCategory; maxCount?: number }[],
  limits?: multer.Options['limits']
) {
  const storage = multer.memoryStorage();
  const fieldConfigs: multer.Field[] = fields.map((f) => ({
    name: f.name,
    maxCount: f.maxCount || 1,
  }));

  const fileFilter = (_req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
    const field = fields.find((f) => f.name === file.fieldname);
    if (!field) {
      callback(new Error(`Unexpected field: ${file.fieldname}`));
      return;
    }
    const policy = UPLOAD_POLICIES[field.category];

    if (!validateMimeType(file.mimetype, policy)) {
      callback(new Error(`Invalid file type for ${file.fieldname}. Allowed: ${policy.allowedExtensions.join(', ')}`));
      return;
    }

    if (!validateExtension(file.originalname, policy)) {
      callback(new Error(`Invalid file extension for ${file.fieldname}. Allowed: ${policy.allowedExtensions.join(', ')}`));
      return;
    }

    const filenameResult = validateFilename(file.originalname);
    if (!filenameResult.valid) {
      callback(new Error(filenameResult.error || 'Invalid filename'));
      return;
    }

    callback(null, true);
  };

  return multer({
    storage,
    limits: {
      files: fields.reduce((sum, f) => sum + (f.maxCount || 1), 0),
      ...limits,
    },
    fileFilter,
  }).fields(fieldConfigs);
}

export function handleMulterError(error: any): string {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return 'File is too large';
      case 'LIMIT_FILE_COUNT':
        return 'Too many files';
      case 'LIMIT_UNEXPECTED_FILE':
        return `Unexpected file field: ${error.field}`;
      case 'LIMIT_PART_COUNT':
        return 'Too many parts';
      case 'LIMIT_FIELD_KEY':
        return 'Field name too long';
      case 'LIMIT_FIELD_VALUE':
        return 'Field value too long';
      case 'LIMIT_FIELD_COUNT':
        return 'Too many fields';
      default:
        return 'Upload error';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Upload failed';
}

export { FileCategory } from '../config/upload';
