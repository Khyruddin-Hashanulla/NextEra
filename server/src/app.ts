import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import passport from 'passport';
import { corsOptions } from './config/cors';
import { env } from './config/env';
import { connectDB } from './config/db';
import { verifyTransporter } from './config/nodemailer';
import './config/passport';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { requestLogger } from './middlewares/logger.middleware';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { maintenanceMode } from './middlewares/maintenance.middleware';
import { bulkSeedFeatures } from './services/featureToggle.service';
import { startScheduler } from './services/scheduler.service';
import routes from './routes/index';
import { logger } from './utils/logger';

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());
app.use(passport.initialize());
app.use(globalRateLimiter);
app.use(requestLogger);
app.use(maintenanceMode);

app.use('/api/v1', routes);

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
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

startServer();

export default app;
