import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { connectDatabase, databaseHealth } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectRedis, redis, redisHealth } from './config/redis.js';

async function start() {
  await Promise.all([connectDatabase(), connectRedis()]);
  const app = createApp({
    databaseHealth,
    redisHealth,
    workerHealth: async () => (await redis.exists('ojx:worker:heartbeat')) === 1
  });
  const server = http.createServer(app);
  const io = new SocketIOServer(server, { cors: { origin: env.CORS_ORIGIN.split(','), credentials: true } });
  app.set('io', io);

  server.listen(env.PORT, () => logger.info({ port: env.PORT }, 'API server listening'));
}

start().catch((error) => { logger.fatal({ error }, 'API startup failed'); process.exit(1); });
