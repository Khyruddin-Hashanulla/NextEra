import { cloudinary } from '../config/cloudinary';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export class UploadService {
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private readonly allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  private readonly allowedDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed',
  ];
  private readonly maxImageSize = 5 * 1024 * 1024;
  private readonly maxVideoSize = 200 * 1024 * 1024;
  private readonly maxDocSize = 50 * 1024 * 1024;

  async uploadImage(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw ApiError.badRequest('Invalid image type. Allowed: JPEG, PNG, WebP, GIF');
    }
    if (file.size > this.maxImageSize) {
      throw ApiError.badRequest('Image size must be less than 5MB');
    }
    return this.uploadToCloudinary(file, 'nextera/images');
  }

  async uploadVideo(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    if (!this.allowedVideoTypes.includes(file.mimetype)) {
      throw ApiError.badRequest('Invalid video type. Allowed: MP4, WebM, OGG');
    }
    if (file.size > this.maxVideoSize) {
      throw ApiError.badRequest('Video size must be less than 200MB');
    }
    return this.uploadToCloudinary(file, 'nextera/videos', { resource_type: 'video' });
  }

  async uploadDocument(file: Express.Multer.File): Promise<{ url: string; publicId: string; name: string }> {
    if (!this.allowedDocTypes.includes(file.mimetype)) {
      throw ApiError.badRequest('Invalid document type. Allowed: PDF, DOC, DOCX, ZIP');
    }
    if (file.size > this.maxDocSize) {
      throw ApiError.badRequest('Document size must be less than 50MB');
    }
    const result = await this.uploadToCloudinary(file, 'nextera/resources', { resource_type: 'raw' });
    return { ...result, name: file.originalname };
  }

  private async uploadToCloudinary(
    file: Express.Multer.File,
    folder: string,
    options: Record<string, any> = {}
  ): Promise<{ url: string; publicId: string }> {
    try {
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder, ...options },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
      return { url: result.secure_url, publicId: result.public_id };
    } catch (error) {
      logger.error('Cloudinary upload failed:', error);
      throw ApiError.internal('File upload failed');
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
