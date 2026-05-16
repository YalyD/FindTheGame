import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/requireAuth.js'
import { Notification } from '../models/Notification.js'

export const notificationsRouter = Router()

notificationsRouter.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const notifications = await Notification.find({ recipient: req.user!.userId })
    .sort({ createdAt: -1 })
    .limit(30)
  res.json(notifications)
})

notificationsRouter.patch('/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
  await Notification.updateMany({ recipient: req.user!.userId, read: false }, { read: true })
  res.json({ ok: true })
})
