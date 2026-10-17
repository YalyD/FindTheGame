import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/requireAuth.js'
import * as pushService from '../services/pushService.js'
import { SubscribeBody } from '../validators/push.js'

export function getVapidPublicKey(_req: Request, res: Response) {
  res.json({ key: pushService.getVapidPublicKey() })
}

export async function subscribe(req: AuthRequest, res: Response) {
  await pushService.subscribe(req.user!.userId, req.body as SubscribeBody)
  res.status(201).json({ ok: true })
}
