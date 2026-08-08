import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';

const DENYLIST_PREFIX = 'ojx:token:revoked:';

/**
 * Issue a short-lived access token (JWT, 15m default).
 */
export function issueAccessToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, username: user.username },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

/**
 * Issue a long-lived refresh token (JWT, 7d default).
 */
export function issueRefreshToken(user) {
  return jwt.sign(
    { id: user._id.toString(), type: 'refresh' },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN }
  );
}

/**
 * Verify an access token and return its payload.
 * Throws if invalid or expired.
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

/**
 * Verify a refresh token. Also checks the Redis denylist.
 */
export async function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
  if (payload.type !== 'refresh') throw new Error('Not a refresh token');

  const revoked = await redis.get(`${DENYLIST_PREFIX}${token}`);
  if (revoked) throw new Error('Refresh token has been revoked');

  return payload;
}

/**
 * Revoke a refresh token (add to Redis denylist until its natural expiry).
 */
export async function revokeRefreshToken(token) {
  try {
    const payload = jwt.decode(token);
    if (!payload?.exp) return;
    const ttl = payload.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.set(`${DENYLIST_PREFIX}${token}`, '1', 'EX', ttl);
    }
  } catch {
    // Token is already invalid; nothing to revoke
  }
}
