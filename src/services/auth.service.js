import { User } from '../models/user.model.js';
import {
  issueAccessToken,
  issueRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from './token.service.js';

/**
 * Register a new user.
 */
export async function signup({ email, username, password }) {
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const field = existing.email === email.toLowerCase() ? 'email' : 'username';
    const err = new Error(`${field} is already taken`);
    err.status = 409;
    throw err;
  }

  // passwordHash field triggers bcrypt pre-save hook
  const user = new User({ email, username, passwordHash: password });
  await user.save();

  const accessToken = issueAccessToken(user);
  const refreshToken = issueRefreshToken(user);

  return { user, accessToken, refreshToken };
}

/**
 * Authenticate an existing user.
 */
export async function login({ email, password }) {
  // Must select passwordHash explicitly (it's select:false)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const accessToken = issueAccessToken(user);
  const refreshToken = issueRefreshToken(user);

  return { user, accessToken, refreshToken };
}

/**
 * Rotate a refresh token: verify old, issue new pair.
 */
export async function refresh({ refreshToken }) {
  const payload = await verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.id);
  if (!user) {
    const err = new Error('User not found');
    err.status = 401;
    throw err;
  }

  // Revoke old refresh token (rotation)
  await revokeRefreshToken(refreshToken);

  const newAccessToken = issueAccessToken(user);
  const newRefreshToken = issueRefreshToken(user);

  return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
}

/**
 * Logout: revoke the refresh token.
 */
export async function logout({ refreshToken }) {
  await revokeRefreshToken(refreshToken);
}
