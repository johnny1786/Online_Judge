import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { createHealthRouter } from './routes/health.routes.js';

export function createApp(healthDependencies = {}) {
  const app = express();
  const health = {
    databaseHealth: healthDependencies.databaseHealth ?? (() => false),
    redisHealth: healthDependencies.redisHealth ?? (() => false),
    workerHealth: healthDependencies.workerHealth ?? (() => false)
  };

  app.disable('x-powered-by');
  app.use(pinoHttp({ logger, genReqId: (req) => req.headers['x-request-id'] ?? crypto.randomUUID() }));
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(','), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.RATE_LIMIT_MAX, standardHeaders: true, legacyHeaders: false }));
  app.use('/health', createHealthRouter(health));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
