/**
 * Integration tests for /health routes.
 * Mocks Redis and BullMQ queue to avoid live connections.
 */
import { jest } from '@jest/globals';

// Must mock before any import of the app
jest.unstable_mockModule('../../src/config/redis.js', () => ({
  redis: {
    call: jest.fn().mockResolvedValue(null),
    status: 'ready',
    exists: jest.fn().mockResolvedValue(0),
    quit: jest.fn(),
  },
  connectRedis: jest.fn(),
  redisHealth: jest.fn(() => true),
  disconnectRedis: jest.fn(),
}));

jest.unstable_mockModule('../../src/queues/submission.queue.js', () => ({
  submissionQueue: {},
  enqueueSubmission: jest.fn().mockResolvedValue({}),
}));

import request from 'supertest';
const { createApp } = await import('../../src/app.js');

describe('health routes', () => {
  it('reports healthy dependencies', async () => {
    const app = createApp({ databaseHealth: () => true, redisHealth: () => true, workerHealth: () => true });
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok' });
    expect(response.body.services).toHaveLength(3);
  });

  it('reports an unavailable component', async () => {
    const unhealthy = createApp({ databaseHealth: () => false, redisHealth: () => true, workerHealth: () => true });
    const response = await request(unhealthy).get('/health/db');
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ name: 'database', status: 'unavailable' });
  });
});
