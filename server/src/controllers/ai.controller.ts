import { Request, Response, NextFunction } from 'express';
import * as aiService from '../services/ai.service';

export const generateDescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const content = await aiService.generateCourseDescription(
      req.body.title,
      req.body.category,
      req.body.level,
      req.body.keywords || []
    );
    res.json({ success: true, data: { content } });
  } catch (err) {
    next(err);
  }
};

export const generateQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const content = await aiService.generateQuizQuestions(
      req.body.topic,
      req.body.count || 5,
      req.body.difficulty || 'medium'
    );
    res.json({ success: true, data: { content } });
  } catch (err) {
    next(err);
  }
};

export const generateAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const content = await aiService.generateAssignment(req.body.topic, req.body.duration, req.body.skills);
    res.json({ success: true, data: { content } });
  } catch (err) {
    next(err);
  }
};

export const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const content = await aiService.chatWithAI(req.body.message, req.body.history || []);
    res.json({ success: true, data: { content } });
  } catch (err) {
    next(err);
  }
};
