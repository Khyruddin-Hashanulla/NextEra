import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as blogController from '../controllers/blog.controller';
import { createBlogCommentSchema, updateBlogCommentSchema } from '../validators/blog.validator';

const router = Router();

router.get('/blogs', blogController.listPublishedBlogs);
router.get('/blogs/featured', blogController.getFeaturedBlogs);
router.get('/blogs/categories', blogController.getBlogCategories);
router.get('/blogs/:slug', blogController.getBlogBySlug);

router.get('/blogs/:blogId/comments', blogController.getBlogComments);
router.post('/blogs/:blogId/comments', authenticate, validate(createBlogCommentSchema), blogController.createComment);
router.put('/blogs/comments/:commentId', authenticate, validate(updateBlogCommentSchema), blogController.updateComment);
router.delete('/blogs/comments/:commentId', authenticate, blogController.deleteComment);
router.post('/blogs/comments/:commentId/like', authenticate, blogController.toggleCommentLike);

router.post('/blogs/:blogId/bookmark', authenticate, blogController.toggleBookmark);
router.get('/bookmarks', authenticate, blogController.getUserBookmarks);

export default router;
