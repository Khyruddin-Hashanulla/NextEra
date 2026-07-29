import { Request, Response, NextFunction } from 'express';
import { NESTING_LIMITS } from '../utils/validation';
import { ApiError } from '../utils/ApiError';

function getDepth(value: unknown, currentDepth = 0): number {
  if (currentDepth > NESTING_LIMITS.MAX_DEPTH) return currentDepth;
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      let max = currentDepth + 1;
      for (const item of value) {
        const d = getDepth(item, currentDepth + 1);
        if (d > max) max = d;
      }
      return max;
    }
    let max = currentDepth + 1;
    for (const val of Object.values(value as Record<string, unknown>)) {
      const d = getDepth(val, currentDepth + 1);
      if (d > max) max = d;
    }
    return max;
  }
  return currentDepth;
}

function countKeys(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  if (Array.isArray(value)) {
    return value.reduce<number>((sum, item) => sum + countKeys(item), 0);
  }
  const obj = value as Record<string, unknown>;
  const ownKeys = Object.keys(obj).length;
  return ownKeys + Object.values(obj).reduce<number>((sum, val) => sum + countKeys(val), 0);
}

export function payloadGuard(req: Request, _res: Response, next: NextFunction): void {
  if (!req.body || Object.keys(req.body).length === 0) {
    next();
    return;
  }

  const depth = getDepth(req.body);
  if (depth > NESTING_LIMITS.MAX_DEPTH) {
    next(ApiError.badRequest(`Payload exceeds maximum nesting depth of ${NESTING_LIMITS.MAX_DEPTH}`));
    return;
  }

  const totalKeys = countKeys(req.body);
  if (totalKeys > NESTING_LIMITS.MAX_KEYS) {
    next(ApiError.badRequest(`Payload exceeds maximum field count of ${NESTING_LIMITS.MAX_KEYS}`));
    return;
  }

  next();
}
