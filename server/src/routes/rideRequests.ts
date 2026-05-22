import { Router, Response } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/requireAuth.js'
import { validate, objectIdSchema } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimits.js'
import { HttpError } from '../middleware/errorHandler.js'
import { RideRequest } from '../models/RideRequest.js'

export const rideRequestsRouter = Router()

const createBody = z.object({
  gameId: objectIdSchema,
  origin: z.string().trim().min(3).max(200),
  seatsNeeded: z.number().int().min(1).max(8),
})

const idParam = z.object({ id: objectIdSchema })

rideRequestsRouter.post(
  '/',
  requireAuth,
  writeLimiter,
  validate(createBody),
  async (req: AuthRequest, res: Response) => {
    const { gameId, origin, seatsNeeded } = req.body as z.infer<typeof createBody>

    const existing = await RideRequest.findOne({
      game: gameId,
      passenger: req.user!.userId,
      status: 'open',
    })
    if (existing) throw new HttpError(409, 'כבר קיימת בקשה פתוחה למשחק זה')

    const request = await RideRequest.create({
      game: gameId,
      passenger: req.user!.userId,
      origin,
      seatsNeeded,
    })

    res.status(201).json(request)
  },
)

rideRequestsRouter.get('/mine', requireAuth, async (req: AuthRequest, res: Response) => {
  const requests = await RideRequest.find({ passenger: req.user!.userId })
    .populate('game')
    .sort({ createdAt: -1 })
  res.json(requests)
})

rideRequestsRouter.patch(
  '/:id/cancel',
  requireAuth,
  validate(idParam, 'params'),
  async (req: AuthRequest, res: Response) => {
    const request = await RideRequest.findOne({
      _id: req.params.id,
      passenger: req.user!.userId,
    })
    if (!request) throw new HttpError(404, 'הבקשה לא נמצאה')
    if (request.status !== 'open') {
      throw new HttpError(409, 'לא ניתן לבטל בקשה שכבר הותאמה')
    }
    await request.deleteOne()
    res.json({ ok: true })
  },
)
