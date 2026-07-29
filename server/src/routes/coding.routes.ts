import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { ROLES } from '../constants/roles';
import { validate } from '../middlewares/validate.middleware';
import { verifyCodingSubmissionOwnership } from '../middlewares/ownership.middleware';
import * as codingController from '../controllers/codingProblem.controller';
import {
  createCodingProblemSchema,
  updateCodingProblemSchema,
  submitCodeSchema,
} from '../validators/coding.validator';

const router = Router();

router.get('/problems', authenticate, codingController.listProblems);
router.get('/problems/slug/:slug', authenticate, codingController.getProblemBySlug);
router.get('/problems/:problemId', authenticate, codingController.getProblemById);

router.post(
  '/problems',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(createCodingProblemSchema),
  codingController.createProblem,
);

router.put(
  '/problems/:problemId',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  validate(updateCodingProblemSchema),
  codingController.updateProblem,
);

router.delete(
  '/problems/:problemId',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  codingController.deleteProblem,
);

router.get(
  '/my-problems',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  codingController.listInstructorProblems,
);

router.post(
  '/problems/:problemId/submit',
  authenticate,
  validate(submitCodeSchema),
  codingController.submitCode,
);

router.get(
  '/problems/:problemId/submissions',
  authenticate,
  codingController.getUserSubmissions,
);

router.get(
  '/submissions/:submissionId',
  authenticate,
  verifyCodingSubmissionOwnership,
  codingController.getSubmissionById,
);

router.get(
  '/submissions',
  authenticate,
  codingController.getAllUserSubmissions,
);

export default router;
