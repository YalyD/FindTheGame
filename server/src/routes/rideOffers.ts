import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/requireAuth.js'
import { RideOffer } from '../models/RideOffer.js'

export const rideOffersRouter = Router()

rideOffersRouter.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { gameId, origin, seatsAvailable } = req.body as {
    gameId?: string
    origin?: string
    seatsAvailable?: number
  }

  if (!gameId || !origin || !seatsAvailable) {
    res.status(400).json({ error: 'gameId, origin and seatsAvailable are required' })
    return
  }

  const existing = await RideOffer.findOne({
    game: gameId,
    driver: req.user!.userId,
    status: 'open',
  })
  if (existing) {
    res.status(409).json({ error: 'כבר קיימת הצעה פתוחה למשחק זה' })
    return
  }

  const offer = await RideOffer.create({
    game: gameId,
    driver: req.user!.userId,
    origin,
    seatsAvailable,
  })

  res.status(201).json(offer)
})

rideOffersRouter.get('/mine', requireAuth, async (req: AuthRequest, res: Response) => {
  const offers = await RideOffer.find({ driver: req.user!.userId })
    .populate('game')
    .sort({ createdAt: -1 })
  res.json(offers)
})
