import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getProfile(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Profile fetched successfully', user));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateProfile(req.currentUser!.userId, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Profile updated successfully', user));
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.currentUser!.userId;
  const file = req.file;
  if (!file) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(ApiResponse.success('No file provided', null));
    return;
  }
  const { url, publicId } = await userService.uploadAvatar(userId, file);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Avatar uploaded successfully', { url, publicId }));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await userService.changePassword(req.currentUser!.userId, currentPassword, newPassword);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Password changed successfully', null));
});
