import { Router } from 'express';
import multer from 'multer';
import { uploadImage, uploadVideo, uploadDocument } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { ROLES } from '../constants/roles';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(authenticate);
router.use(authorize(ROLES.INSTRUCTOR, ROLES.ADMIN));

router.post('/image', upload.single('file'), uploadImage);
router.post('/video', upload.single('file'), uploadVideo);
router.post('/document', upload.single('file'), uploadDocument);

export default router;
