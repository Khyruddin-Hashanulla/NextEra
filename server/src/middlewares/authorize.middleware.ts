import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { MESSAGES } from '../constants/messages';
import { Role } from '../constants/roles';

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.currentUser) {
      next(ApiError.unauthorized(MESSAGES.ERROR.TOKEN_REQUIRED));
      return;
    }

    if (!allowedRoles.includes(req.currentUser.role)) {
      next(ApiError.forbidden(MESSAGES.ERROR.FORBIDDEN));
      return;
    }

    next();
  };
};
