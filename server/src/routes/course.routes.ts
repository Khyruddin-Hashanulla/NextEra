import { Router } from 'express';
import {
  create,
  getById,
  getBySlug,
  update,
  remove,
  duplicate,
  listMyCourses,
  listAll,
  submitForReview,
  approve,
  reject,
  publish,
  unpublish,
  archive,
  restore,
  toggleFeatured,
  markCourseContentCompleted,
  getCurriculum,
  getPublishedCurriculum,
  getOwnerCurriculum,
  createSection,
  updateSection,
  removeSection,
  reorderSections,
  getSection,
  createLecture,
  updateLecture,
  removeLecture,
  reorderLectures,
  getLecture,
  moveLecture,
} from '../controllers/course.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { ROLES } from '../constants/roles';
import {
  verifyCourseOwnership,
  verifySectionOwnership,
  verifyLectureOwnership,
} from '../middlewares/ownership.middleware';
import {
  createCourseSchema,
  updateCourseSchema,
  createSectionSchema,
  updateSectionSchema,
  createLectureSchema,
  updateLectureSchema,
  reorderSectionsSchema,
  reorderLecturesSchema,
  moveLectureSchema,
} from '../validators/course.validator';

const router = Router();

// Public
router.get('/all', listAll);
router.get('/slug/:slug', getBySlug);

// Instructor courses
router.get('/instructor', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), listMyCourses);

router.get('/:id', getById);
router.get('/:id/curriculum', getCurriculum);
router.get(
  '/:id/curriculum/owner',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  verifyCourseOwnership,
  getOwnerCurriculum
);
router.get('/:id/curriculum/published', authenticate, getPublishedCurriculum);
router.get('/:id/sections/:sectionId', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), getSection);
router.get('/:id/lectures/:lectureId', getLecture);

router.post('/', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), validate(createCourseSchema), create);
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  verifyCourseOwnership,
  validate(updateCourseSchema),
  update
);
router.delete('/:id', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), verifyCourseOwnership, remove);
router.post('/:id/duplicate', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), verifyCourseOwnership, duplicate);

// Publishing
router.post(
  '/:id/submit',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  verifyCourseOwnership,
  submitForReview
);
router.post('/:id/approve', authenticate, authorize(ROLES.ADMIN), approve);
router.post('/:id/reject', authenticate, authorize(ROLES.ADMIN), reject);
router.post('/:id/publish', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), verifyCourseOwnership, publish);
router.post('/:id/unpublish', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), verifyCourseOwnership, unpublish);
router.post('/:id/archive', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), verifyCourseOwnership, archive);
router.post('/:id/restore', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), verifyCourseOwnership, restore);
router.post('/:id/featured', authenticate, authorize(ROLES.ADMIN), toggleFeatured);
router.post(
  '/:id/content/complete',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  verifyCourseOwnership,
  markCourseContentCompleted
);

// Sections
router.post(
  '/:id/sections',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  verifyCourseOwnership,
  validate(createSectionSchema),
  createSection
);
router.put(
  '/:id/sections/reorder',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  verifyCourseOwnership,
  validate(reorderSectionsSchema),
  reorderSections
);
router.put(
  '/:id/sections/:sectionId',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  verifySectionOwnership,
  validate(updateSectionSchema),
  updateSection
);
router.delete(
  '/:id/sections/:sectionId',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  verifySectionOwnership,
  removeSection
);

// Lectures
router.post(
  '/:id/sections/:sectionId/lectures',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  verifySectionOwnership,
  validate(createLectureSchema),
  createLecture
);
router.put(
  '/:id/lectures/:lectureId',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  verifyLectureOwnership,
  validate(updateLectureSchema),
  updateLecture
);
router.delete(
  '/:id/lectures/:lectureId',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  verifyLectureOwnership,
  removeLecture
);
router.put(
  '/:id/sections/:sectionId/lectures/reorder',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  verifySectionOwnership,
  validate(reorderLecturesSchema),
  reorderLectures
);
router.put(
  '/:id/lectures/:lectureId/move',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.ADMIN),
  verifyLectureOwnership,
  validate(moveLectureSchema),
  moveLecture
);

export default router;
