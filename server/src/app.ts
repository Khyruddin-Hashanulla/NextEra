import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import passport from 'passport';
import { corsOptions } from './config/cors';
import { env } from './config/env';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { verifyTransporter } from './config/nodemailer';
import './config/passport';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { requestLogger } from './middlewares/logger.middleware';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { maintenanceMode } from './middlewares/maintenance.middleware';
import { httpsRedirect } from './middlewares/httpsRedirect.middleware';
import { payloadGuard } from './middlewares/payloadGuard.middleware';
import { bulkSeedFeatures } from './services/featureToggle.service';
import { startScheduler } from './services/scheduler.service';
import { doubleCsrfProtection } from './config/csrf';
import csrfRoutes from './routes/csrf.routes';
import zoomWebhookRoutes from './routes/zoomWebhook.routes';
import routes from './routes/index';
import { logger } from './utils/logger';
import { ApiError } from './utils/ApiError';
import { sanitizeRequestBody } from './utils/sanitize';
import path from 'path';
import fs from 'fs';
import { handleSitemap, handleSitemapType } from './services/sitemap.service';
import { cacheService } from './cache/cache.service';

const app = createApp();

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await connectRedis();
    await verifyTransporter();
    await bulkSeedFeatures();
    startScheduler();

    const server = app.listen(env.port);
    server.on('listening', () => {
      logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
      logger.info(`Health check: http://localhost:${env.port}/health`);
    });
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${env.port} is already in use. Try changing PORT in server/.env`);
      } else {
        logger.error('Failed to start server:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export function createApp(): express.Application {
  const app = express();

  if (env.nodeEnv === 'production') {
    app.set('trust proxy', 1);
    logger.info('Trust proxy enabled (production)');
  }

  app.use(httpsRedirect);

  app.use(
    helmet({
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use('/api/v1', zoomWebhookRoutes);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(mongoSanitize());
  app.use(sanitizeRequestBody);
  app.use(payloadGuard);

  const uploadsDir = path.join(__dirname, '../uploads');
  if (fs.existsSync(uploadsDir)) {
    app.use('/uploads', express.static(uploadsDir));
  }

  app.get('/sitemap.xml', handleSitemap);
  app.get('/sitemaps/:type.xml', handleSitemapType);

  app.use(passport.initialize());
  app.use(globalRateLimiter);
  app.use(requestLogger);
  app.use(maintenanceMode);

  app.use('/api/v1', csrfRoutes);

  app.use('/api/v1', (req, res, next) => {
    doubleCsrfProtection(req, res, (err) => {
      if (err) {
        next(ApiError.forbidden('Invalid or missing CSRF token'));
      } else {
        next();
      }
    });
  });

  app.use('/api/v1', routes);

  app.get('/health', async (_req, res) => {
    const cacheHealth = await cacheService.healthCheck();
    const cacheStats = cacheService.getStats();
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      cache: { ...cacheHealth, ...cacheStats },
    });
  });

  app.use(errorHandler);

  return app;
}

export default app;
