import { Request, Response } from 'express';
import { categoryService } from '../services/category.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HTTP_STATUS } from '../constants/httpStatus';

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const data = await categoryService.listCategories();
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Categories fetched', data));
});
