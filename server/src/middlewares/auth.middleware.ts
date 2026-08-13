import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/generateToken';
import { ApiError } from '../utils/ApiError';
import { MESSAGES } from '../constants/messages';
import { TokenPayload } from '../interfaces/IUser';
import { User as UserModel } from '../models/user.model';
import { RevokedToken } from '../models/revokedToken.model';
import type { InstructorPlanInfo } from '../services/subscriptionPermission.service';

declare global {
  namespace Express {
    interface Request {
      currentUser?: TokenPayload;
      instructorPlan?: InstructorPlanInfo;
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized(MESSAGES.ERROR.TOKEN_REQUIRED);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const userDoc = await UserModel.findById(decoded.userId);
    if (!userDoc || !userDoc.isActive) {
      throw ApiError.unauthorized(MESSAGES.ERROR.UNAUTHORIZED);
    }

    if (decoded.jti) {
      const revoked = await RevokedToken.findOne({ jti: decoded.jti });
      if (revoked) {
        throw ApiError.unauthorized(MESSAGES.ERROR.SESSION_EXPIRED);
      }
    }

    if (decoded.tokenVersion !== undefined && decoded.tokenVersion < userDoc.tokenVersion) {
      throw ApiError.unauthorized(MESSAGES.ERROR.SESSION_EXPIRED);
    }

    req.currentUser = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized(MESSAGES.ERROR.INVALID_TOKEN));
    }
  }
};

/**
 * Optional authentication: populates `req.currentUser` when a valid Bearer
 * token is present, but never blocks the request. Used on routes that must stay
 * public (e.g. the course-details endpoint) yet need to personalize/enrich
 * responses for signed-in users — most importantly to detect whether the
 * current user is enrolled so `isEnrolled` is set correctly.
 */
export const optionalAuthenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const userDoc = await UserModel.findById(decoded.userId);
    if (userDoc && userDoc.isActive) {
      req.currentUser = decoded;
    }
    return next();
  } catch {
    // Invalid/expired token: fall through as anonymous — the route must stay public.
    return next();
  }
};
