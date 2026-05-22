import rateLimit from 'express-rate-limit'
import { AuthRequest } from './requireAuth.js'

const minute = 60 * 1000
const hour = 60 * minute

// Per-IP limiter for the login endpoint — prevents brute-forcing /api/auth/google
// with garbage tokens (each verifyIdToken call is CPU-bound).
export const authLimiter = rateLimit({
  windowMs: 15 * minute,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'too_many_login_attempts' },
})

// Generic per-IP limiter mounted on /api — backstop against scrapers/abuse.
export const apiLimiter = rateLimit({
  windowMs: 1 * minute,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'rate_limited' },
})

// Per-user limiter for write endpoints — spam protection.
// Falls back to IP if the request isn't authenticated yet.
export const writeLimiter = rateLimit({
  windowMs: 1 * hour,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as AuthRequest).user?.userId
    return userId ?? req.ip ?? 'unknown'
  },
  message: { error: 'rate_limited' },
})
