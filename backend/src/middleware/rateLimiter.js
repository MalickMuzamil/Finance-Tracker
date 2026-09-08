import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config/env.js';

/**
 * Helper to inspect the request for an authenticated user token
 * without making redundant DB lookups.
 */
export function getUserInfoFromRequest(req) {
  if (req.user) {
    return {
      id: req.user._id?.toString() || req.user.id,
      role: req.user.role,
    };
  }

  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7).trim();
      const payload = jwt.verify(token, jwtSecret);
      if (payload && payload.sub) {
        return {
          id: payload.sub,
          role: payload.role,
        };
      }
    } catch {
      // Expired or invalid token, fallback to unauthenticated
    }
  }

  return null;
}

/**
 * General API Rate Limiter
 * - SuperAdmin: 1500 requests / 15 minutes (High limit)
 * - Standard User: 300 requests / 15 minutes
 * - Guest / Unauthenticated: 100 requests / 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: (req) => {
    const user = getUserInfoFromRequest(req);
    if (user?.role === 'SUPER_ADMIN') {
      return 1500; // Superadmin gets significantly higher limit
    }
    if (user) {
      return 300; // Standard authenticated user
    }
    return 100; // Guest / Public
  },
  keyGenerator: (req) => {
    const user = getUserInfoFromRequest(req);
    if (user?.id) {
      return `user_${user.id}`;
    }
    // Safely generate IP key with IPv6 fallback support
    return ipKeyGenerator(req);
  },
  validate: {
    keyGeneratorIpFallback: false,
    xForwardedForHeader: false,
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Too many requests. Please slow down and try again later.',
  },
  skip: (req) => req.method === 'OPTIONS' || req.path === '/health',
});

/**
 * Strict Rate Limiter for Authentication Endpoints (Login / Signup)
 * Protects against brute-force attacks and credential stuffing
 * - 15 attempts / 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  skip: (req) => req.method === 'OPTIONS',
});

export default {
  apiLimiter,
  authLimiter,
  getUserInfoFromRequest,
};
