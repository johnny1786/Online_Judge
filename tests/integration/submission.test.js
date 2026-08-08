/**
 * Integration tests for submission routes.
 *
 * Mocks auth middleware and submission service so no real DB/Redis is needed.
 */

import { jest } from '@jest/globals';
import request from 'supertest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCreateSubmission = jest.fn();
const mockGetSubmission = jest.fn();
const mockListSubmissions = jest.fn();

jest.unstable_mockModule('../../src/services/submission.service.js', () => ({
  createSubmission: mockCreateSubmission,
  getSubmission: mockGetSubmission,
  listSubmissions: mockListSubmissions,
}));

// Mock auth middleware to inject a fake user
jest.unstable_mockModule('../../src/middlewares/auth.js', () => ({
  authenticate: (req, _res, next) => {
    req.user = { _id: 'user-id-1', role: 'user', id: 'user-id-1' };
    next();
  },
  authorize: () => (_req, _res, next) => next(),
}));

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

// Prevent BullMQ from connecting to Redis at module load time
jest.unstable_mockModule('../../src/queues/submission.queue.js', () => ({
  submissionQueue: {},
  enqueueSubmission: jest.fn().mockResolvedValue({}),
}));

const { createApp } = await import('../../src/app.js');

const app = createApp({
  databaseHealth: () => true,
  redisHealth: () => true,
  workerHealth: () => true,
});

describe('POST /submissions', () => {
  it('returns 201 on valid submission', async () => {
    const fakeSubmission = {
      id: 'sub-1',
      status: 'queued',
      language: 'python',
      problemId: 'prob-1',
    };
    mockCreateSubmission.mockResolvedValue(fakeSubmission);

    const res = await request(app).post('/submissions').send({
      problemSlug: 'two-sum',
      language: 'python',
      code: 'print(int(input()))',
    });

    expect(res.status).toBe(201);
    expect(res.body.submission.status).toBe('queued');
  });

  it('returns 400 for invalid language', async () => {
    const res = await request(app).post('/submissions').send({
      problemSlug: 'two-sum',
      language: 'ruby', // not supported
      code: 'puts 42',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 when code is missing', async () => {
    const res = await request(app).post('/submissions').send({
      problemSlug: 'two-sum',
      language: 'python',
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /submissions/:id', () => {
  it('returns 200 with submission data', async () => {
    const fakeSubmission = { id: 'sub-1', status: 'accepted', language: 'cpp' };
    mockGetSubmission.mockResolvedValue(fakeSubmission);

    const res = await request(app).get('/submissions/sub-1');

    expect(res.status).toBe(200);
    expect(res.body.submission.status).toBe('accepted');
  });

  it('returns 404 when submission is not found', async () => {
    const err = new Error('Submission not found');
    err.status = 404;
    mockGetSubmission.mockRejectedValue(err);

    const res = await request(app).get('/submissions/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('GET /submissions', () => {
  it('returns paginated list of submissions', async () => {
    mockListSubmissions.mockResolvedValue({
      submissions: [{ id: 'sub-1', status: 'accepted' }],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    });

    const res = await request(app).get('/submissions');

    expect(res.status).toBe(200);
    expect(res.body.submissions).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
  });
});
