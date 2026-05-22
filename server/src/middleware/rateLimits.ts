import rateLimit, { Options } from 'express-rate-limit'
import { AuthRequest } from './requireAuth.js'

const minute = 60 * 1000
const hour = 60 * minute

// Rate limiting is disabled in tests so a fast test suite doesn't trip
// the per-IP buckets shared across all supertest calls.
const skipInTest = (_req: unknown) => process.env.NODE_ENV === 'test'

function makeLimiter(opts: Partial<Options>) {
  return rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: skipInTest,
    ...opts,
  })
}

// Per-IP limiter for the login endpoint — prevents brute-forcing /api/auth/google
// with garbage tokens (each verifyIdToken call is CPU-bound).
export const authLimiter = makeLimiter({
  windowMs: 15 * minute,
  limit: 30,
  message: { error: 'too_many_login_attempts' },
})

// Generic per-IP limiter mounted on /api — backstop against scrapers/abuse.
export const apiLimiter = makeLimiter({
  windowMs: 1 * minute,
  limit: 120,
  message: { error: 'rate_limited' },
})

// Per-user limiter for write endpoints — spam protection.
// Falls back to IP if the request isn't authenticated yet.
export const writeLimiter = makeLimiter({
  windowMs: 1 * hour,
  limit: 30,
  keyGenerator: (req) => {
    const userId = (req as AuthRequest).user?.userId
    return userId ?? req.ip ?? 'unknown'
  },
  message: { error: 'rate_limited' },
})
