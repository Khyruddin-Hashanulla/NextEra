import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { ROLES } from '../constants/roles';
import { validate } from '../middlewares/validate.middleware';
import * as aiController from '../controllers/ai.controller';
import {
  generateDescriptionSchema,
  generateQuizSchema,
  generateAssignmentSchema,
  chatSchema,
} from '../validators/ai.validator';

const router = Router();

router.post(
  '/generate-description',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(generateDescriptionSchema),
  aiController.generateDescription
);

router.post(
  '/generate-quiz',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(generateQuizSchema),
  aiController.generateQuiz
);

router.post(
  '/generate-assignment',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(generateAssignmentSchema),
  aiController.generateAssignment
);

router.post('/chat', authenticate, validate(chatSchema), aiController.chat);

export default router;
