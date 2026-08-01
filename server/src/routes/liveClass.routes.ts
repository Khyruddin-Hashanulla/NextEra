import { Router } from 'express';
import {
  listInstructorLiveClasses, getLiveClass, createLiveClass, updateLiveClass,
  cancelLiveClass, startLiveClass, endLiveClass,
  listInstructorRecordings, addRecording, deleteRecording,
  syncInstructorRecordings, getInstructorRecording,
  listStudentLiveClasses, joinLiveClass, leaveLiveClass,
  listStudentRecordings, incrementRecordingView,
} from '../controllers/liveClass.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { requireFeaturePermission } from '../middlewares/subscription.middleware';
import { subscriptionPermissionService } from '../services/subscriptionPermission.service';
import { validate } from '../middlewares/validate.middleware';
import { ROLES } from '../constants/roles';
import { verifyLiveClassOwnership } from '../middlewares/ownership.middleware';
import {
  createLiveClassSchema, updateLiveClassSchema, addRecordingSchema,
  syncRecordingSchema, recordingParamsSchema,
} from '../validators/liveClass.validator';

const router = Router();

router.use(authenticate);

// ─── Instructor Routes ─────────────────────────────────────────
router.get('/instructor', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), listInstructorLiveClasses);
router.get('/instructor/recordings', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), listInstructorRecordings);
router.post('/instructor/recordings', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), validate(addRecordingSchema), addRecording);
router.post('/instructor/recordings/sync', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), validate(syncRecordingSchema), syncInstructorRecordings);
router.get('/instructor/recordings/:id', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), validate(recordingParamsSchema, 'params'), getInstructorRecording);
router.delete('/instructor/recordings/:id', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), validate(recordingParamsSchema, 'params'), deleteRecording);

router.post('/', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), requireFeaturePermission(
  (info) => subscriptionPermissionService.canScheduleLiveClass(info),
  'Live classes', 'Pro'
), validate(createLiveClassSchema), createLiveClass);
router.put('/:id', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), verifyLiveClassOwnership, validate(updateLiveClassSchema), updateLiveClass);
router.post('/:id/cancel', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), verifyLiveClassOwnership, cancelLiveClass);
router.post('/:id/start', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), verifyLiveClassOwnership, startLiveClass);
router.post('/:id/end', authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), verifyLiveClassOwnership, endLiveClass);

// ─── Student Routes ────────────────────────────────────────────
router.get('/student', listStudentLiveClasses);
router.get('/student/recordings', listStudentRecordings);
router.post('/:id/join', joinLiveClass);
router.post('/:id/leave', leaveLiveClass);

// ─── Shared ────────────────────────────────────────────────────
router.get('/:id', getLiveClass);
router.post('/recordings/:id/view', incrementRecordingView);

export default router;
