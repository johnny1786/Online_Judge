import { signup, login, refresh, logout } from '../services/auth.service.js';

/**
 * POST /auth/signup
 */
export async function signupHandler(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await signup(req.body);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/login
 */
export async function loginHandler(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await login(req.body);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/refresh
 * Reads refreshToken from httpOnly cookie or body.
 */
export async function refreshHandler(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const { user, accessToken, refreshToken: newRefreshToken } = await refresh({ refreshToken });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ user, accessToken });
  } catch (err) {
    err.status = err.status ?? 401;
    next(err);
  }
}

/**
 * POST /auth/logout
 */
export async function logoutHandler(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;
    if (refreshToken) await logout({ refreshToken });

    res.clearCookie('refreshToken');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /auth/me — returns the current authenticated user.
 */
export async function meHandler(req, res) {
  res.status(200).json({ user: req.user });
}
