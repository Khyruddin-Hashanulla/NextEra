import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { ROLES } from '../constants/roles';
import * as forumController from '../controllers/forum.controller';
import {
  createForumTopicSchema,
  replyToForumTopicSchema,
  forumListQuerySchema,
  forumTopicIdParamSchema,
  forumReplyIdParamSchema,
  forumSolvedSchema,
  forumBestAnswerSchema,
  forumPinSchema,
  forumLockSchema,
} from '../validators/forum.validator';

const router = Router();

// Public reads
router.get('/forum', optionalAuthenticate, validate(forumListQuerySchema, 'query'), forumController.listForumTopics);
router.get('/forum/categories', forumController.listForumCategories);
router.get('/forum/stats', forumController.getForumStats);
router.get('/forum/:id', optionalAuthenticate, validate(forumTopicIdParamSchema, 'params'), forumController.getForumTopic);

// Authenticated actions (any role)
router.post('/forum', authenticate, validate(createForumTopicSchema), forumController.createForumTopic);
router.post('/forum/:id/reply', authenticate, validate(forumTopicIdParamSchema, 'params'), validate(replyToForumTopicSchema), forumController.replyToForumTopic);
router.post('/forum/:id/like', authenticate, validate(forumTopicIdParamSchema, 'params'), forumController.toggleForumTopicLike);
router.patch('/forum/:id/solved', authenticate, validate(forumTopicIdParamSchema, 'params'), validate(forumSolvedSchema), forumController.markForumTopicSolved);
router.patch('/forum/:id/best-answer', authenticate, validate(forumTopicIdParamSchema, 'params'), validate(forumBestAnswerSchema), forumController.markForumBestAnswer);
router.delete('/forum/:id', authenticate, validate(forumTopicIdParamSchema, 'params'), forumController.deleteForumTopic);
router.delete('/forum/:id/replies/:replyId', authenticate, validate(forumReplyIdParamSchema, 'params'), forumController.deleteForumReply);

// Admin moderation
router.patch('/forum/:id/pin', authenticate, authorize(ROLES.ADMIN), validate(forumTopicIdParamSchema, 'params'), validate(forumPinSchema), forumController.setForumTopicPinned);
router.patch('/forum/:id/lock', authenticate, authorize(ROLES.ADMIN), validate(forumTopicIdParamSchema, 'params'), validate(forumLockSchema), forumController.setForumTopicLocked);

export default router;