import { Router, Request, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/requireAuth.js'
import { PushSubscription } from '../models/PushSubscription.js'

export const pushRouter = Router()

pushRouter.get('/vapid-public-key', (_req: Request, res: Response) => {
  const key = process.env.VAPID_PUBLIC_KEY
  if (!key) {
    res.status(503).json({ error: 'push not configured' })
    return
  }
  res.json({ key })
})

pushRouter.post('/subscribe', requireAuth, async (req: AuthRequest, res: Response) => {
  const { endpoint, keys } = req.body as {
    endpoint?: string
    keys?: { p256dh: string; auth: string }
  }
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: 'invalid subscription object' })
    return
  }

  await PushSubscription.findOneAndUpdate(
    { endpoint },
    { user: req.user!.userId, endpoint, keys },
    { upsert: true, new: true },
  )

  res.status(201).json({ ok: true })
})
