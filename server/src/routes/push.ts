import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimits.js'
import { HttpError } from '../middleware/errorHandler.js'
import { env } from '../lib/env.js'
import { PushSubscription } from '../models/PushSubscription.js'

export const pushRouter = Router()

const subscribeBody = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(10).max(200),
    auth: z.string().min(10).max(200),
  }),
})

pushRouter.get('/vapid-public-key', (_req: Request, res: Response) => {
  const key = env().VAPID_PUBLIC_KEY
  if (!key) throw new HttpError(503, 'push_not_configured')
  res.json({ key })
})

pushRouter.post(
  '/subscribe',
  requireAuth,
  writeLimiter,
  validate(subscribeBody),
  async (req: AuthRequest, res: Response) => {
    const { endpoint, keys } = req.body as z.infer<typeof subscribeBody>
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { user: req.user!.userId, endpoint, keys },
      { upsert: true, new: true },
    )
    res.status(201).json({ ok: true })
  },
)
