import { Request, Response, NextFunction, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { auditService } from '../services/audit.service';
import { getIp, getUserAgent } from '../services/dataScoping.service';

export interface AuditOptions {
  action: string;
  resourceType: string;
  resourceId?: string | ((req: Request) => string | undefined);
  resourceName?: string | ((req: Request) => string | undefined);
  getPreviousData?: (req: Request) => Promise<Record<string, any> | undefined>;
  getNewData?: (req: Request, result: any) => Record<string, any> | undefined;
}

export function previousDataLoader(model: mongoose.Model<any>): (req: Request) => Promise<Record<string, any> | undefined> {
  return async (req: Request) => {
    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return undefined;
    const doc = await model.findById(id).lean();
    return doc || undefined;
  };
}

export function audit(options: AuditOptions): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    res.locals.audit = options;
    next();
  };
}

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    const opts: AuditOptions | undefined = res.locals.audit;

    const admin = req.currentUser;
    if (!admin || !opts) {
      return originalJson(body);
    }

    const resourceId = typeof opts.resourceId === 'function' ? opts.resourceId(req) : opts.resourceId || req.params.id;
    const resourceName =
      typeof opts.resourceName === 'function'
        ? opts.resourceName(req)
        : opts.resourceName || undefined;

    const prevPromise = opts.getPreviousData ? opts.getPreviousData(req) : Promise.resolve(undefined);

    prevPromise
      .then(async (previousData) => {
        const newData = opts.getNewData ? opts.getNewData(req, body) : body?.data?.data || body?.data || undefined;

        await auditService.log({
          adminId: admin.userId,
          adminName: '',
          adminEmail: admin.email,
          action: opts.action,
          resourceType: opts.resourceType,
          resourceId,
          resourceName,
          previousData,
          newData,
          requestMethod: req.method,
          requestUrl: req.originalUrl,
          route: req.route?.path || req.baseUrl + (req.route?.path || ''),
          statusCode: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 400,
          errorMessage: res.statusCode >= 400 ? (body?.message || 'Unknown error') : undefined,
          ipAddress: getIp(req),
          userAgent: getUserAgent(req),
          requestId: (req as any).id,
        });
      })
      .catch(() => {
        // fire-and-forget; never fail the request due to audit logging
      });

    return originalJson(body);
  };

  next();
}
