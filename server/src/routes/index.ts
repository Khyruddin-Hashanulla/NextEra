import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import instructorRoutes from './instructor.routes';
import courseRoutes from './course.routes';
import uploadRoutes from './upload.routes';
import studentRoutes from './student.routes';
import paymentRoutes from './payment.routes';
import revenueRoutes from './revenue.routes';
import liveClassRoutes from './liveClass.routes';
import codingRoutes from './coding.routes';
import blogRoutes from './blog.routes';
import studyReminderRoutes from './studyReminder.routes';
import aiRoutes from './ai.routes';
import affiliateRoutes from './affiliate.routes';
import quizRoutes from './quiz.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/instructor', instructorRoutes);
router.use('/courses', courseRoutes);
router.use('/upload', uploadRoutes);
router.use('/student', studentRoutes);
router.use('/payments', paymentRoutes);
router.use('/revenue', revenueRoutes);
router.use('/live-classes', liveClassRoutes);
router.use('/coding', codingRoutes);
router.use('/', blogRoutes);
router.use('/study-reminders', studyReminderRoutes);
router.use('/ai', aiRoutes);
router.use('/affiliate', affiliateRoutes);
router.use('/quiz', quizRoutes);

export default router;
