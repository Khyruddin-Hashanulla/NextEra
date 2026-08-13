import { Router } from 'express';
import { getProfile, updateProfile, uploadAvatar, changePassword } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateProfileSchema, changePasswordSchema } from '../validators/user.validator';
import { createUploadMiddleware, FileCategory, handleMulterError } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

router.get('/me', getProfile);
router.put('/me', validate(updateProfileSchema), updateProfile);
router.post(
  '/me/avatar',
  (req, res, next) => {
    const upload = createUploadMiddleware(FileCategory.PROFILE_PICTURE);
    upload.single('avatar')(req, res, (err) => {
      if (err) {
        res.status(400).json({ success: false, message: handleMulterError(err), data: null });
        return;
      }
      next();
    });
  },
  uploadAvatar
);
router.put('/me/password', validate(changePasswordSchema), changePassword);

export default router;
