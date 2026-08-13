import { Router, Request, Response, NextFunction } from 'express';
import { uploadImage, uploadVideo, uploadDocument, uploadAssignment } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { ROLES } from '../constants/roles';
import { createUploadMiddleware, FileCategory } from '../middlewares/upload.middleware';
import { handleMulterError } from '../middlewares/upload.middleware';
import { uploadLimiter } from '../middlewares/rateLimiter.middleware';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

const router = Router();

router.use(authenticate);
router.use(uploadLimiter);

function runMulter(
  category: FileCategory,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const upload = createUploadMiddleware(category);
    upload.single('file')(req, res, (err) => {
      if (err) {
        res.status(400).json({ success: false, message: handleMulterError(err), data: null });
        return;
      }
      next();
    });
  } catch (error) {
    logger.error('Multer middleware error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    next(ApiError.badRequest(message));
  }
}

router.post(
  '/image',
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  (req, res, next) => runMulter(FileCategory.IMAGE, req, res, next),
  uploadImage
);

router.post(
  '/video',
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  (req, res, next) => runMulter(FileCategory.VIDEO, req, res, next),
  uploadVideo
);

router.post(
  '/document',
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  (req, res, next) => runMulter(FileCategory.DOCUMENT, req, res, next),
  uploadDocument
);

router.post(
  '/assignment',
  (req, res, next) => runMulter(FileCategory.ASSIGNMENT_FILE, req, res, next),
  uploadAssignment
);

export default router;
