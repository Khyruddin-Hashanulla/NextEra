import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export function httpsRedirect(req: Request, res: Response, next: NextFunction): void {
  if (env.nodeEnv !== 'production') {
    next();
    return;
  }

  if (req.secure || req.protocol === 'https') {
    next();
    return;
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${env.port}`;
  const redirectUrl = `https://${host}${req.originalUrl}`;

  logger.warn('HTTPS redirect', {
    from: `${req.protocol}://${host}${req.originalUrl}`,
    to: redirectUrl,
    ip: req.ip,
    method: req.method,
  });

  res.redirect(301, redirectUrl);
}
