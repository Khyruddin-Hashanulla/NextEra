import { Request, Response } from 'express';
import { uploadService } from '../services/upload.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(ApiResponse.success('No file provided', null));
    return;
  }
  const data = await uploadService.uploadImage(req.file);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Image uploaded', data));
});

export const uploadVideo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(ApiResponse.success('No file provided', null));
    return;
  }
  const data = await uploadService.uploadVideo(req.file);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Video uploaded', data));
});

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(ApiResponse.success('No file provided', null));
    return;
  }
  const data = await uploadService.uploadDocument(req.file);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Document uploaded', data));
});
