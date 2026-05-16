import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/requireAuth.js'
import { RideRequest } from '../models/RideRequest.js'

export const rideRequestsRouter = Router()

rideRequestsRouter.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { gameId, origin, seatsNeeded } = req.body as {
    gameId?: string
    origin?: string
    seatsNeeded?: number
  }

  if (!gameId || !origin || !seatsNeeded) {
    res.status(400).json({ error: 'gameId, origin and seatsNeeded are required' })
    return
  }

  const existing = await RideRequest.findOne({
    game: gameId,
    passenger: req.user!.userId,
    status: 'open',
  })
  if (existing) {
    res.status(409).json({ error: 'כבר קיימת בקשה פתוחה למשחק זה' })
    return
  }

  const request = await RideRequest.create({
    game: gameId,
    passenger: req.user!.userId,
    origin,
    seatsNeeded,
  })

  res.status(201).json(request)
})

rideRequestsRouter.get('/mine', requireAuth, async (req: AuthRequest, res: Response) => {
  const requests = await RideRequest.find({ passenger: req.user!.userId })
    .populate('game')
    .sort({ createdAt: -1 })
  res.json(requests)
})

rideRequestsRouter.patch('/:id/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
  const request = await RideRequest.findOne({ _id: req.params.id, passenger: req.user!.userId })
  if (!request) {
    res.status(404).json({ error: 'הבקשה לא נמצאה' })
    return
  }
  if (request.status !== 'open') {
    res.status(409).json({ error: 'לא ניתן לבטל בקשה שכבר הותאמה' })
    return
  }
  await request.deleteOne()
  res.json({ ok: true })
})
