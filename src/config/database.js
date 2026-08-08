import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDatabase() {
  mongoose.connection.on('error', (error) => logger.error({ error }, 'MongoDB connection error'));
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  logger.info('MongoDB connected');
}

export function databaseHealth() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
