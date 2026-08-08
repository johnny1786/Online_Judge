import { verifyAccessToken } from '../services/token.service.js';
import { User } from '../models/user.model.js';

/**
 * authenticate — verify Bearer JWT and attach req.user (full DB user doc).
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Bearer token required' });
    }
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * authorize(...roles) — RBAC guard. Must run after authenticate.
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
