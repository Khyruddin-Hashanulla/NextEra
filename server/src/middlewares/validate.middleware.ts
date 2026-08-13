import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

type Source = 'body' | 'query' | 'params';

/**
 * Resolve the underlying object `shape` of a schema. `.refine()` / `.superRefine()`
 * wrap the object in a ZodEffects (no `.shape`), so a `{ body: ... }` wrapper
 * wouldn't be detected otherwise and the raw request body would be parsed against
 * the wrapped schema (yielding `body: Required`).
 */
function getObjectShape(schema: ZodSchema): Record<string, unknown> | undefined {
  let current: any = schema;
  while (current && typeof current === 'object' && (current._def?.innerType ?? current._def?.schema)) {
    current = current._def.innerType ?? current._def.schema;
  }
  const shape = current?.shape;
  return shape && typeof shape === 'object' ? shape : undefined;
}

export const validate = (schema: ZodSchema, source: Source = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const shape = getObjectShape(schema);
      const isWrapped = !!shape && Object.keys(shape).length === 1 && (shape as any)[source] !== undefined;
      const data = isWrapped ? schema.parse({ [source]: req[source] }) : schema.parse(req[source]);
      req[source] = isWrapped ? (data as any)[source] : data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        next(ApiError.badRequest(messages.map((m) => `${m.field}: ${m.message}`).join(', ')));
      } else {
        next(error);
      }
    }
  };
};
