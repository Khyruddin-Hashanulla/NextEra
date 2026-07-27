import { Router } from 'express';
import {
  create, getById, getBySlug, update, remove, duplicate,
  listMyCourses, listAll,
  submitForReview, approve, reject, publish, unpublish, archive, toggleFeatured,
  getCurriculum, getPublishedCurriculum,
  createSection, updateSection, removeSection, reorderSections, getSection,
  createLecture, updateLecture, removeLecture, reorderLectures, getLecture,
} from '../controllers/course.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { ROLES } from '../constants/roles';
import {
  createCourseSchema, updateCourseSchema,
  createSectionSchema, updateSectionSchema,
  createLectureSchema, updateLectureSchema,
  reorderSectionsSchema, reorderLecturesSchema,
} from '../validators/course.validator';

const router = Router();

// Public
router.get('/all', listAll);
router.get('/slug/:slug', getBySlug);

// Instructor courses
router.get('/instructor', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), listMyCourses);

router.get('/:id', getById);
router.get('/:id/curriculum', getCurriculum);
router.get('/:id/curriculum/published', authenticate, getPublishedCurriculum);
router.get('/:id/sections/:sectionId', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), getSection);
router.get('/:id/lectures/:lectureId', getLecture);

router.post('/', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), validate(createCourseSchema), create);
router.put('/:id', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), validate(updateCourseSchema), update);
router.delete('/:id', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), remove);
router.post('/:id/duplicate', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), duplicate);

// Publishing
router.post('/:id/submit', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), submitForReview);
router.post('/:id/approve', authenticate, authorize(ROLES.ADMIN), approve);
router.post('/:id/reject', authenticate, authorize(ROLES.ADMIN), reject);
router.post('/:id/publish', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), publish);
router.post('/:id/unpublish', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), unpublish);
router.post('/:id/archive', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), archive);
router.post('/:id/featured', authenticate, authorize(ROLES.ADMIN), toggleFeatured);

// Sections
router.post('/:id/sections', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), validate(createSectionSchema), createSection);
router.put('/:id/sections/:sectionId', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), validate(updateSectionSchema), updateSection);
router.delete('/:id/sections/:sectionId', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), removeSection);
router.put('/:id/sections/reorder', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), validate(reorderSectionsSchema), reorderSections);

// Lectures
router.post('/:id/sections/:sectionId/lectures', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), validate(createLectureSchema), createLecture);
router.put('/:id/lectures/:lectureId', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), validate(updateLectureSchema), updateLecture);
router.delete('/:id/lectures/:lectureId', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), removeLecture);
router.put('/:id/sections/:sectionId/lectures/reorder', authenticate, authorize(ROLES.INSTRUCTOR, ROLES.ADMIN), validate(reorderLecturesSchema), reorderLectures);

export default router;
