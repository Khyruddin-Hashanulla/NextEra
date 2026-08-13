import { Request, Response, NextFunction } from 'express';
import * as blogService from '../services/blog.service';

export const listPublishedBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 12, 50);
    const result = await blogService.listPublishedBlogs({
      page,
      limit,
      category: req.query.category as string,
      tag: req.query.tag as string,
      search: req.query.search as string,
      userId: req.currentUser?.userId,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getFeaturedBlogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 6, 20);
    const blogs = await blogService.getFeaturedBlogs(limit);
    res.json({ success: true, blogs });
  } catch (err) {
    next(err);
  }
};

export const getBlogBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blog = await blogService.getBlogBySlug(req.params.slug, req.currentUser?.userId);
    res.json({ success: true, data: blog });
  } catch (err) {
    next(err);
  }
};

export const getBlogCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await blogService.getBlogCategories();
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

export const getBlogComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const result = await blogService.getBlogComments(req.params.blogId, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await blogService.createComment(
      req.params.blogId,
      req.currentUser!.userId,
      req.body.content,
      req.body.parent
    );
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

export const updateComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await blogService.updateComment(req.params.commentId, req.currentUser!.userId, req.body.content);
    res.json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.currentUser?.role === 'admin';
    await blogService.deleteComment(req.params.commentId, req.currentUser!.userId, isAdmin);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};

export const toggleCommentLike = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await blogService.toggleCommentLike(req.params.commentId, req.currentUser!.userId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const toggleBookmark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await blogService.toggleBookmark(req.params.blogId, req.currentUser!.userId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const getUserBookmarks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const result = await blogService.getUserBookmarks(req.currentUser!.userId, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
