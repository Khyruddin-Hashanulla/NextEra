import { Router } from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateProfileSchema, changePasswordSchema } from '../validators/user.validator';

const router = Router();

router.use(authenticate);

router.get('/me', getProfile);
router.put('/me', validate(updateProfileSchema), updateProfile);
router.put('/me/password', validate(changePasswordSchema), changePassword);

export default router;
