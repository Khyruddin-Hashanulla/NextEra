import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ApiError) {
    logger.warn(`ApiError: ${err.statusCode} - ${err.message}`, {
      code: err.code,
      path: req.path,
      method: req.method,
    });
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code && { code: err.code }),
      ...(env.nodeEnv === 'development' && { stack: err.stack }),
    });
    return;
  }

  logger.error('Unhandled error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = 500;
  res.status(statusCode).json({
    success: false,
    message: 'An internal server error occurred',
    ...(env.nodeEnv === 'development' && { error: err.message, stack: err.stack }),
  });
};
