import { cloudinary } from '../config/cloudinary';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { FileCategory, UPLOAD_POLICIES } from '../config/upload';
import { validateCloudinaryResponse, validateUploadedFile, getPolicyForCategory } from '../utils/upload';

export class UploadService {
  private static readonly MIN_UPLOAD_TIMEOUT_MS = 60_000;
  private static readonly MAX_UPLOAD_TIMEOUT_MS = 15 * 60_000;
  private static readonly ASSUMED_MIN_THROUGHPUT_BPS = 256 * 1024;
  private static readonly PROCESSING_MARGIN_MS = 60_000;

  private calculateUploadTimeout(fileSize: number): number {
    const transferMs = Math.ceil(fileSize / UploadService.ASSUMED_MIN_THROUGHPUT_BPS) * 1000;
    const timeout = transferMs + UploadService.PROCESSING_MARGIN_MS;
    return Math.min(UploadService.MAX_UPLOAD_TIMEOUT_MS, Math.max(UploadService.MIN_UPLOAD_TIMEOUT_MS, timeout));
  }

  private translateCloudinaryError(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    const httpCode = (error as { http_code?: unknown })?.http_code;
    const name = (error as { name?: unknown })?.name;
    const message = typeof (error as { message?: unknown })?.message === 'string' ? (error as { message: string }).message : '';

    if (httpCode === 400 && /file size too large/i.test(message)) {
      const sizeMatch = message.match(/Maximum is (\d+)/);
      const maxBytes = sizeMatch ? parseInt(sizeMatch[1], 10) : null;
      const maxMB = maxBytes ? Math.round(maxBytes / (1024 * 1024)) : null;
      return ApiError.badRequest(
        maxMB ? `File is too large. The upload service supports files up to ${maxMB}MB.` : 'File is too large for the upload service.'
      );
    }

    if (httpCode === 400 && /unsupported/i.test(message)) {
      return ApiError.badRequest('File format is not supported by the upload service.');
    }

    if (httpCode === 499 || name === 'TimeoutError' || /request timeou?t/i.test(message)) {
      return ApiError.internal('File upload timed out. The file may be too large or the upload service is slow. Please try again with a smaller file.');
    }

    return ApiError.internal('File upload failed');
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    const policy = getPolicyForCategory(FileCategory.IMAGE);
    validateUploadedFile(file, policy);
    return this.uploadToCloudinary(file, policy.cloudinaryFolder, { resource_type: 'image' });
  }

  async uploadVideo(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    const policy = getPolicyForCategory(FileCategory.VIDEO);
    validateUploadedFile(file, policy);
    return this.uploadToCloudinary(file, policy.cloudinaryFolder, { resource_type: 'video' });
  }

  async uploadDocument(file: Express.Multer.File): Promise<{ url: string; publicId: string; name: string }> {
    const policy = getPolicyForCategory(FileCategory.DOCUMENT);
    validateUploadedFile(file, policy);
    const result = await this.uploadToCloudinary(file, policy.cloudinaryFolder, { resource_type: 'raw' });
    return { ...result, name: file.originalname };
  }

  async uploadAssignmentFile(file: Express.Multer.File): Promise<{ url: string; publicId: string; name: string }> {
    const policy = getPolicyForCategory(FileCategory.ASSIGNMENT_FILE);
    validateUploadedFile(file, policy);
    const result = await this.uploadToCloudinary(file, policy.cloudinaryFolder, { resource_type: 'raw' });
    return { ...result, name: file.originalname };
  }

  async uploadFile(file: Express.Multer.File, category: FileCategory): Promise<{ url: string; publicId: string }> {
    const policy = getPolicyForCategory(category);
    validateUploadedFile(file, policy);
    return this.uploadToCloudinary(file, policy.cloudinaryFolder, { resource_type: policy.cloudinaryResourceType });
  }

  private async uploadToCloudinary(
    file: Express.Multer.File,
    folder: string,
    options: Record<string, any> = {}
  ): Promise<{ url: string; publicId: string }> {
    const timeout = this.calculateUploadTimeout(file.size);
    try {
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder, ...options, timeout },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
      return validateCloudinaryResponse(result);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error('Cloudinary upload failed:', error);
      throw this.translateCloudinaryError(error);
    }
  }

  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
      logger.error('Cloudinary delete failed:', error);
    }
  }
}

export const uploadService = new UploadService();
