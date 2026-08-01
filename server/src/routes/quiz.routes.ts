import { Router } from 'express';
import {
  startQuiz,
  startQuizEnhanced,
  submitQuiz,
  autoSubmitQuiz,
  resumeQuiz,
  getStudentQuizAttempts,
  getAttemptDetails,
  getStudentAnalytics,
  getStudentQuizOverview,
  manualGradeAttempt,
  publishGrade,
  getQuizAnalytics,
  getQuestionStatistics,
  getLeaderboard,
  exportQuizData,
  getQuizAnalyticsForAdmin,
  invalidateQuizCache,
} from '../controllers/quiz.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { verifyQuizAttemptOwnership } from '../middlewares/dataScoping.middleware';
import { validate } from '../middlewares/validate.middleware';
import { ROLES } from '../constants/roles';
import {
  startQuizSchema,
  submitQuizSchema,
  resumeQuizSchema,
  overrideGradeSchema,
} from '../validators/quiz.validator';

const router = Router();

// All quiz routes require authentication
router.use(authenticate);

// ─── Student Quiz Flow (authenticated) ────────────────────────────────

router.post('/start', validate(startQuizSchema), startQuiz);
router.post('/start-enhanced', validate(startQuizSchema), startQuizEnhanced);
router.post('/submit', validate(submitQuizSchema), submitQuiz);
router.post('/auto-submit', validate(submitQuizSchema), autoSubmitQuiz);
router.post('/resume', validate(resumeQuizSchema), resumeQuiz);
router.get('/attempts/:lectureId', getStudentQuizAttempts);
router.get('/attempts/:attemptId/details', getAttemptDetails);
router.get('/analytics/:lectureId', getStudentAnalytics);
router.get('/overview', getStudentQuizOverview);
router.get('/leaderboard/:lectureId', getLeaderboard);

// ─── Student Result Access (ownership enforced) ───────────────────────
// verifyQuizAttemptOwnership ensures students only read their own attempts.

router.get('/result/:attemptId', verifyQuizAttemptOwnership, getAttemptDetails);

// ─── Instructor / Admin Grading (role enforced) ───────────────────────

router.put('/manual-grade/:attemptId', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), validate(overrideGradeSchema), manualGradeAttempt);
router.put('/publish/:attemptId', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), publishGrade);

// ─── Instructor / Admin Analytics (role enforced) ─────────────────────

router.get('/instructor/analytics/:lectureId', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), getQuizAnalytics);
router.get('/instructor/questions/:lectureId', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), getQuestionStatistics);
router.get('/instructor/export/:attemptId', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), exportQuizData);
router.post('/instructor/invalidate/:lectureId', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), invalidateQuizCache);

// ─── Admin Analytics (admin only) ─────────────────────────────────────

router.get('/admin/analytics', authorize(ROLES.ADMIN), getQuizAnalyticsForAdmin);

export default router;
