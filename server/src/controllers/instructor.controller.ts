import { Request, Response, NextFunction } from 'express';
import { instructorService } from '../services/instructor.service';
import { paymentService } from '../services/payment.service';
import { uploadService } from '../services/upload.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { HTTP_STATUS } from '../constants/httpStatus';
import { quizService } from '../services/quiz.service';
import { FileCategory } from '../config/upload';
import { sanitizeRequestBody } from '../utils/sanitize';

const APPLY_JSON_FIELDS = ['teachingCategories', 'taxDetails', 'bankDetails'] as const;

const APPLY_FILE_FIELDS: Record<string, FileCategory> = {
  photo: FileCategory.IMAGE,
  resume: FileCategory.DOCUMENT,
  demoVideo: FileCategory.VIDEO,
  identityProof: FileCategory.CERTIFICATE,
};

export const prepareApplyPayload = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const body: Record<string, unknown> = { ...req.body };

  for (const key of APPLY_JSON_FIELDS) {
    const value = body[key];
    if (typeof value === 'string' && value.trim() !== '') {
      try {
        body[key] = JSON.parse(value);
      } catch {
        return next(ApiError.badRequest(`${key} must be valid JSON`));
      }
    }
  }

  const files = (req.files as Record<string, Express.Multer.File[]> | undefined) ?? {};
  for (const [field, category] of Object.entries(APPLY_FILE_FIELDS)) {
    const file = files[field]?.[0];
    if (file) {
      const { url, publicId } = await uploadService.uploadFile(file, category);
      body[field] = { url, publicId };
    }
  }

  req.body = body;
  sanitizeRequestBody(req, _res, next);
});

export const apply = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.apply(req.currentUser!.userId, req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Application submitted', data));
});

export const getApplicationStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.getApplicationStatus(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Application status fetched', data));
});

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.getDashboard(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Dashboard data fetched', data));
});

export const getRevenue = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as any;
  const data = await instructorService.getRevenue(req.currentUser!.userId, startDate, endDate);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Revenue data fetched', data));
});

export const getMyPayouts = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const data = await paymentService.getInstructorPayouts(req.currentUser!.userId, page, limit);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Payouts fetched', data));
});

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.getAnalytics(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Analytics fetched', data));
});

export const getStudents = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.getStudents(req.currentUser!.userId, {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    search: req.query.search as string,
  });
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Students fetched', data));
});

export const listCoupons = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.listCoupons(req.currentUser!.userId, {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
  });
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Coupons fetched', data));
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.createCoupon(req.currentUser!.userId, req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Coupon created', data));
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.updateCoupon(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Coupon updated', data));
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  await instructorService.deleteCoupon(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Coupon deleted', null));
});

export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.getReviews(req.currentUser!.userId, {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
  });
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Reviews fetched', data));
});

export const replyToReview = asyncHandler(async (req: Request, res: Response) => {
  const { reply } = req.body;
  const data = await instructorService.replyToReview(req.currentUser!.userId, req.params.id, reply);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Reply added', data));
});

export const listAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.listAnnouncements(req.currentUser!.userId, {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
  });
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Announcements fetched', data));
});

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.createAnnouncement(req.currentUser!.userId, req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Announcement created', data));
});

export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  await instructorService.deleteAnnouncement(req.params.id);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Announcement deleted', null));
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.getProfile(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Profile fetched', data));
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.currentUser!.userId;
  const file = req.file;
  if (!file) {
    res.status(HTTP_STATUS.BAD_REQUEST).json(ApiResponse.success('No file provided', null));
    return;
  }
  const { url, publicId } = await instructorService.uploadAvatar(userId, file);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Avatar uploaded successfully', { url, publicId }));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.updateProfile(req.currentUser!.userId, req.body);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Profile updated', data));
});

export const getSubscriptionStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.getSubscriptionStatus(req.currentUser!.userId);
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Subscription status fetched', data));
});

export const listCertificates = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.listCertificates(req.currentUser!.userId, {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
  });
  res.status(HTTP_STATUS.OK).json(ApiResponse.success('Certificates fetched', data));
});

export const issueCertificate = asyncHandler(async (req: Request, res: Response) => {
  const data = await instructorService.issueCertificate(req.currentUser!.userId, req.body);
  res.status(HTTP_STATUS.CREATED).json(ApiResponse.success('Certificate issued', data));
});
