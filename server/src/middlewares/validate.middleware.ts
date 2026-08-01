import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodObject } from 'zod';
import { ApiError } from '../utils/ApiError';

type Source = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, source: Source = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const shape = (schema as ZodObject<any> | undefined)?.shape;
      const isWrapped =
        !!shape && typeof shape === 'object' && Object.keys(shape).length === 1 && shape[source] !== undefined;
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
