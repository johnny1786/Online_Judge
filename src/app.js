import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { RedisStore } from 'rate-limit-redis';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { redis } from './config/redis.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { authRouter } from './routes/auth.routes.js';
import { createHealthRouter } from './routes/health.routes.js';
import { problemRouter } from './routes/problem.routes.js';
import { submissionRouter } from './routes/submission.routes.js';

export function createApp(healthDependencies = {}) {
  const app = express();
  const health = {
    databaseHealth: healthDependencies.databaseHealth ?? (() => false),
    redisHealth: healthDependencies.redisHealth ?? (() => false),
    workerHealth: healthDependencies.workerHealth ?? (() => false),
  };

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Request logging
  app.use(pinoHttp({ logger, genReqId: (req) => req.headers['x-request-id'] ?? crypto.randomUUID() }));

  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors({ origin: env.CORS_ORIGIN.split(','), credentials: true }));

  // Cookie parser (for httpOnly refresh token cookie)
  app.use(cookieParser());

  // JSON body limit
  app.use(express.json({ limit: '1mb' }));

  // Global rate limit — Redis-backed in production, memory in test
  const makeStore = () => {
    if (env.NODE_ENV === 'test') return undefined; // uses default memory store
    return new RedisStore({ sendCommand: (...args) => redis.call(...args) });
  };

  const globalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    store: makeStore(),
  });

  // Tighter rate limit for auth login/signup endpoints (50 req / 15 min)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later' },
    store: makeStore(),
  });

  // Routes (support both /api/* and /*)
  const healthR = createHealthRouter(health);
  const authR = authRouter(authLimiter);

  app.use(['/health', '/api/health'], healthR);
  app.use(['/auth', '/api/auth'], authR);
  app.use(['/problems', '/api/problems'], globalLimiter, problemRouter);
  app.use(['/submissions', '/api/submissions'], globalLimiter, submissionRouter);

  // Serve production frontend assets if built
  const frontendDist = path.join(process.cwd(), 'frontend/dist');
  app.use(express.static(frontendDist));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
