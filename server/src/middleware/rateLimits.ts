import rateLimit, { Options } from 'express-rate-limit'
import { AuthRequest } from './requireAuth.js'

const minute = 60 * 1000
const hour = 60 * minute

const skipInTest = (_req: unknown) => process.env.NODE_ENV !== 'production'

function makeLimiter(opts: Partial<Options>) {
  return rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: skipInTest,
    ...opts,
  })
}

export const authLimiter = makeLimiter({
  windowMs: 15 * minute,
  limit: 30,
  message: { error: 'too_many_login_attempts' },
})

export const apiLimiter = makeLimiter({
  windowMs: 1 * minute,
  limit: 120,
  message: { error: 'הגעת למגבלת הפעולות המותרות, נסה שוב מאוחר יותר' },
})

export const writeLimiter = makeLimiter({
  windowMs: 1 * hour,
  limit: 30,
  keyGenerator: (req) => {
    const userId = (req as AuthRequest).user?.userId
    return userId ?? req.ip ?? 'unknown'
  },
  message: { error: 'הגעת למגבלת הפעולות המותרות, נסה שוב מאוחר יותר' },
})
