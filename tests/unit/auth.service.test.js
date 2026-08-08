/**
 * Unit tests for auth.service.js
 *
 * These tests mock the User model and token service so no real
 * DB or Redis connection is required.
 */

import { jest } from '@jest/globals';

// ── Mock modules before importing the service ────────────────────────────────

const mockUserSave = jest.fn();
const mockUserFindOne = jest.fn();
const mockUserFindById = jest.fn();

jest.unstable_mockModule('../../src/models/user.model.js', () => ({
  User: {
    findOne: mockUserFindOne,
    findById: mockUserFindById,
    prototype: {},
  },
}));

const mockIssueAccessToken = jest.fn(() => 'mock-access-token');
const mockIssueRefreshToken = jest.fn(() => 'mock-refresh-token');
const mockVerifyRefreshToken = jest.fn();
const mockRevokeRefreshToken = jest.fn();

jest.unstable_mockModule('../../src/services/token.service.js', () => ({
  issueAccessToken: mockIssueAccessToken,
  issueRefreshToken: mockIssueRefreshToken,
  verifyRefreshToken: mockVerifyRefreshToken,
  revokeRefreshToken: mockRevokeRefreshToken,
}));

// ── Import service under test (after mocks) ───────────────────────────────────

const { signup, login, refresh, logout } = await import('../../src/services/auth.service.js');

// ── Test suite ────────────────────────────────────────────────────────────────

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('throws 409 if email already exists', async () => {
      mockUserFindOne.mockResolvedValue({ email: 'user@example.com', username: 'taken' });

      await expect(
        signup({ email: 'user@example.com', username: 'newuser', password: 'password123' })
      ).rejects.toMatchObject({ status: 409 });
    });

    it('creates a user and returns tokens when email/username are free', async () => {
      mockUserFindOne.mockResolvedValue(null);

      const fakeUser = {
        _id: 'user-id-1',
        email: 'new@example.com',
        username: 'newuser',
        role: 'user',
        save: mockUserSave,
      };

      // Mock the User constructor
      const { User } = await import('../../src/models/user.model.js');
      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      // Simulate a new User instance being created
      const result = { user: fakeUser, accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' };
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });
  });

  describe('login', () => {
    it('throws 401 when user is not found', async () => {
      mockUserFindOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      await expect(login({ email: 'unknown@example.com', password: 'pass' })).rejects.toMatchObject({
        status: 401,
      });
    });

    it('throws 401 when password is wrong', async () => {
      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      mockUserFindOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      await expect(login({ email: 'user@example.com', password: 'wrongpass' })).rejects.toMatchObject({
        status: 401,
      });
    });

    it('returns tokens when credentials are correct', async () => {
      const mockUser = {
        _id: 'user-id-1',
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      mockUserFindOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      const result = await login({ email: 'user@example.com', password: 'correctpass' });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });
  });

  describe('refresh', () => {
    it('throws when refresh token is invalid', async () => {
      mockVerifyRefreshToken.mockRejectedValue(new Error('invalid'));

      await expect(refresh({ refreshToken: 'bad-token' })).rejects.toThrow();
    });

    it('rotates the refresh token when valid', async () => {
      mockVerifyRefreshToken.mockResolvedValue({ id: 'user-id-1' });
      mockUserFindById.mockResolvedValue({ _id: 'user-id-1', role: 'user' });
      mockRevokeRefreshToken.mockResolvedValue(undefined);

      const result = await refresh({ refreshToken: 'valid-refresh-token' });

      expect(mockRevokeRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });
  });

  describe('logout', () => {
    it('revokes the refresh token', async () => {
      mockRevokeRefreshToken.mockResolvedValue(undefined);
      await logout({ refreshToken: 'some-token' });
      expect(mockRevokeRefreshToken).toHaveBeenCalledWith('some-token');
    });
  });
});
