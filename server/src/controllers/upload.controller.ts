import { Request, Response } from 'express';
import { uploadService } from '../services/upload.service';
import { entitlementService } from '../services/entitlement.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';
import { sanitizeFilename } from '../utils/upload';

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(ApiResponse.success('No file provided', null));
    return;
  }
  file.originalname = sanitizeFilename(file.originalname);
  const data = await uploadService.uploadImage(file);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Image uploaded', data));
});

export const uploadVideo = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(ApiResponse.success('No file provided', null));
    return;
  }
  file.originalname = sanitizeFilename(file.originalname);

  const actor = req.currentUser;
  if (actor && actor.role === 'instructor') {
    const view = await entitlementService.getEntitlementView(actor.userId);
    const maxVideoSizeMB = view.entitlements.storage.maxVideoFileSizeMB;
    if (maxVideoSizeMB > 0 && file.size > maxVideoSizeMB * 1024 * 1024) {
      throw ApiError.badRequest(`File is too large. Your plan supports videos up to ${maxVideoSizeMB}MB.`);
    }
  }

  const data = await uploadService.uploadVideo(file);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Video uploaded', data));
});

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(ApiResponse.success('No file provided', null));
    return;
  }
  file.originalname = sanitizeFilename(file.originalname);
  const data = await uploadService.uploadDocument(file);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Document uploaded', data));
});

export const uploadAssignment = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(ApiResponse.success('No file provided', null));
    return;
  }
  file.originalname = sanitizeFilename(file.originalname);
  const data = await uploadService.uploadAssignmentFile(file);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Assignment file uploaded', data));
});
