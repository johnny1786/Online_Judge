import 'dotenv/config';
import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default('info'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/ojx'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  JWT_SECRET: isProduction
    ? z.string().min(32, 'JWT_SECRET must be at least 32 characters in production')
    : z.string().min(32).default('development-only-secret-change-me-123456789'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: isProduction
    ? z.string().min(32, 'REFRESH_TOKEN_SECRET must be set in production')
    : z.string().min(32).default('development-only-refresh-secret-change-me-123'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
});

export const env = schema.parse(process.env);
