import { cloudinary } from '../config/cloudinary';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { FileCategory, UPLOAD_POLICIES } from '../config/upload';
import { validateCloudinaryResponse, validateUploadedFile, getPolicyForCategory } from '../utils/upload';

export class UploadService {
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
      return validateCloudinaryResponse(result);
    } catch (error) {
      if (error instanceof ApiError) throw error;
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
