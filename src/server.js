import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { connectDatabase, databaseHealth, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectRedis, redis, redisHealth, disconnectRedis } from './config/redis.js';
import { verifyAccessToken } from './services/token.service.js';

async function start() {
  await Promise.all([connectDatabase(), connectRedis()]);

  const app = createApp({
    databaseHealth,
    redisHealth,
    workerHealth: async () => (await redis.exists('ojx:worker:heartbeat')) === 1,
  });

  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: env.CORS_ORIGIN.split(','), credentials: true },
  });

  // Socket.IO JWT authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyAccessToken(token);
      socket.user = payload;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);
    logger.info({ userId, socketId: socket.id }, 'Socket.IO client connected');

    socket.on('disconnect', (reason) => {
      logger.info({ userId, socketId: socket.id, reason }, 'Socket.IO client disconnected');
    });
  });

  app.set('io', io);

  server.listen(env.PORT, () => logger.info({ port: env.PORT }, 'API server listening'));

  // Graceful shutdown
  let isShuttingDown = false;
  async function shutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info({ signal }, 'Shutdown signal received');

    // Stop accepting new HTTP connections
    server.close(async () => {
      logger.info('HTTP server closed');
    });

    // Close Socket.IO
    io.close();

    // Drain with timeout
    const drainTimeout = setTimeout(() => {
      logger.warn('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, 10000);

    try {
      await Promise.all([disconnectDatabase(), disconnectRedis()]);
      logger.info('All connections closed, exiting cleanly');
      clearTimeout(drainTimeout);
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error) => {
  logger.fatal({ error }, 'API startup failed');
  process.exit(1);
});
