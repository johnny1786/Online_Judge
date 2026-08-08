/**
 * Integration tests for auth routes.
 *
 * Uses supertest against the full Express app with mocked DB/Redis dependencies.
 * The app is created with stub health functions so no real connections are needed.
 *
 * Auth service calls are mocked at the service level.
 */

import { jest } from '@jest/globals';
import request from 'supertest';

// ── Mock auth service ─────────────────────────────────────────────────────────

const mockSignup = jest.fn();
const mockLogin = jest.fn();
const mockRefresh = jest.fn();
const mockLogout = jest.fn();

jest.unstable_mockModule('../../src/services/auth.service.js', () => ({
  signup: mockSignup,
  login: mockLogin,
  refresh: mockRefresh,
  logout: mockLogout,
}));

// Mock Redis config to avoid live connection
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

// Mock BullMQ submission queue to avoid Redis connection at module load time
jest.unstable_mockModule('../../src/queues/submission.queue.js', () => ({
  submissionQueue: {},
  enqueueSubmission: jest.fn().mockResolvedValue({}),
}));

const { createApp } = await import('../../src/app.js');

const app = createApp({
  databaseHealth: () => true,
  redisHealth: () => true,
  workerHealth: () => false,
});

describe('POST /auth/signup', () => {
  it('returns 201 and tokens on success', async () => {
    const fakeUser = { id: 'u1', email: 'test@example.com', username: 'testuser', role: 'user' };
    mockSignup.mockResolvedValue({
      user: fakeUser,
      accessToken: 'access-tok',
      refreshToken: 'refresh-tok',
    });

    const res = await request(app).post('/auth/signup').send({
      email: 'test@example.com',
      username: 'testuser',
      password: 'securepassword',
    });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBe('access-tok');
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('returns 400 for invalid request body', async () => {
    const res = await request(app).post('/auth/signup').send({
      email: 'not-an-email',
      username: 'u',
      password: 'short',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 409 when email is already taken', async () => {
    const err = new Error('email is already taken');
    err.status = 409;
    mockSignup.mockRejectedValue(err);

    const res = await request(app).post('/auth/signup').send({
      email: 'taken@example.com',
      username: 'newuser',
      password: 'password123',
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /auth/login', () => {
  it('returns 200 and tokens on valid credentials', async () => {
    const fakeUser = { id: 'u1', email: 'test@example.com', username: 'testuser', role: 'user' };
    mockLogin.mockResolvedValue({
      user: fakeUser,
      accessToken: 'access-tok',
      refreshToken: 'refresh-tok',
    });

    const res = await request(app).post('/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('returns 401 on wrong credentials', async () => {
    const err = new Error('Invalid email or password');
    err.status = 401;
    mockLogin.mockRejectedValue(err);

    const res = await request(app).post('/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('returns 204 and clears the cookie', async () => {
    mockLogout.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/auth/logout')
      .set('Cookie', 'refreshToken=some-token');

    expect(res.status).toBe(204);
  });
});
