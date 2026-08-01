import { Router } from 'express';
import { uploadImage, uploadVideo, uploadDocument, uploadAssignment } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { ROLES } from '../constants/roles';
import { createUploadMiddleware, FileCategory } from '../middlewares/upload.middleware';
import { handleMulterError } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

// Instructor/Admin only upload endpoints
router.post('/image', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), (req, res, next) => {
  const upload = createUploadMiddleware(FileCategory.IMAGE);
  upload.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ success: false, message: handleMulterError(err), data: null });
      return;
    }
    next();
  });
}, uploadImage);

router.post('/video', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), (req, res, next) => {
  const upload = createUploadMiddleware(FileCategory.VIDEO);
  upload.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ success: false, message: handleMulterError(err), data: null });
      return;
    }
    next();
  });
}, uploadVideo);

router.post('/document', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), (req, res, next) => {
  const upload = createUploadMiddleware(FileCategory.DOCUMENT);
  upload.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ success: false, message: handleMulterError(err), data: null });
      return;
    }
    next();
  });
}, uploadDocument);

// Assignment file upload - any authenticated user (students + instructors + admins)
router.post('/assignment', (req, res, next) => {
  const upload = createUploadMiddleware(FileCategory.ASSIGNMENT_FILE);
  upload.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ success: false, message: handleMulterError(err), data: null });
      return;
    }
    next();
  });
}, uploadAssignment);

export default router;
