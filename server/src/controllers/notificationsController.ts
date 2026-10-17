import { Response } from 'express'
import { AuthRequest } from '../middleware/requireAuth.js'
import * as notificationService from '../services/notificationService.js'

export async function list(req: AuthRequest, res: Response) {
  res.json(await notificationService.listForUser(req.user!.userId))
}

export async function markAllRead(req: AuthRequest, res: Response) {
  await notificationService.markAllRead(req.user!.userId)
  res.json({ ok: true })
}
