import { Router, Response } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/requireAuth.js'
import { validate, objectIdSchema } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimits.js'
import { HttpError } from '../middleware/errorHandler.js'
import { RideOffer } from '../models/RideOffer.js'
import { RideRequest } from '../models/RideRequest.js'
import { Notification } from '../models/Notification.js'
import { User } from '../models/User.js'
import { Game } from '../models/Game.js'
import { sendPushToUser } from '../lib/webpush.js'
import { estimateOfferFuelCost } from '../lib/fuelCost.js'

export const rideOffersRouter = Router()

const createBody = z.object({
  gameId: objectIdSchema,
  origin: z.string().trim().min(3).max(200),
  seatsAvailable: z.number().int().min(1).max(8),
})

const joinBody = z.object({ requestId: objectIdSchema })

const idParam = z.object({ id: objectIdSchema })
const gameIdParam = z.object({ gameId: objectIdSchema })

rideOffersRouter.post(
  '/',
  requireAuth,
  writeLimiter,
  validate(createBody),
  async (req: AuthRequest, res: Response) => {
    const { gameId, origin, seatsAvailable } = req.body as z.infer<typeof createBody>

    const existing = await RideOffer.findOne({
      game: gameId,
      driver: req.user!.userId,
      status: 'open',
    })
    if (existing) throw new HttpError(409, 'כבר קיימת הצעה פתוחה למשחק זה')

    const [driver, game] = await Promise.all([
      User.findById(req.user!.userId, 'car'),
      Game.findById(gameId, 'stadium city'),
    ])
    if (!game) throw new HttpError(404, 'המשחק לא נמצא')

    // Best-effort: a failed estimate must never block publishing the offer.
    const fuelCost = await estimateOfferFuelCost(
      driver?.car,
      origin,
      game.stadium,
      game.city,
    ).catch(() => null)

    const offer = await RideOffer.create({
      game: gameId,
      driver: req.user!.userId,
      origin,
      seatsAvailable,
      fuelCost,
    })

    res.status(201).json(offer)
  },
)

rideOffersRouter.get('/mine', requireAuth, async (req: AuthRequest, res: Response) => {
  const offers = await RideOffer.find({ driver: req.user!.userId })
    .populate('game')
    .populate('passengers', 'name picture')
    .sort({ createdAt: -1 })
  res.json(offers)
})

rideOffersRouter.get(
  '/game/:gameId',
  requireAuth,
  validate(gameIdParam, 'params'),
  async (req: AuthRequest, res: Response) => {
    const offers = await RideOffer.find({
      game: req.params.gameId,
      status: 'open',
      driver: { $ne: req.user!.userId },
    })
      .populate('driver', 'name picture')
      .sort({ seatsAvailable: -1, createdAt: 1 })
    res.json(offers)
  },
)

rideOffersRouter.patch(
  '/:id/cancel',
  requireAuth,
  validate(idParam, 'params'),
  async (req: AuthRequest, res: Response) => {
    const offer = await RideOffer.findOne({ _id: req.params.id, driver: req.user!.userId })
    if (!offer) throw new HttpError(404, 'ההצעה לא נמצאה')
    await offer.deleteOne()
    res.json({ ok: true })
  },
)

rideOffersRouter.post(
  '/:id/join',
  requireAuth,
  writeLimiter,
  validate(idParam, 'params'),
  validate(joinBody),
  async (req: AuthRequest, res: Response) => {
    const { requestId } = req.body as z.infer<typeof joinBody>

    const [offer, request] = await Promise.all([
      RideOffer.findById(req.params.id),
      RideRequest.findById(requestId),
    ])

    if (!offer || offer.status !== 'open') {
      throw new HttpError(404, 'ההצעה לא נמצאה או כבר מלאה')
    }
    if (!request || request.passenger.toString() !== req.user!.userId) {
      throw new HttpError(403, 'הבקשה לא נמצאה')
    }
    if (request.status !== 'open') throw new HttpError(409, 'הבקשה כבר הותאמה')
    if (offer.game.toString() !== request.game.toString()) {
      throw new HttpError(400, 'ההצעה והבקשה הן למשחקים שונים')
    }
    if (offer.seatsAvailable < request.seatsNeeded) {
      throw new HttpError(409, 'אין מספיק מושבים פנויים בהצעה זו')
    }

    offer.passengers.push(request.passenger)
    offer.seatsAvailable -= request.seatsNeeded
    if (offer.seatsAvailable === 0) offer.status = 'full'
    await offer.save()

    request.status = 'matched'
    request.matchedOffer = offer._id as typeof request.matchedOffer
    await request.save()

    const [passenger, game] = await Promise.all([
      User.findById(req.user!.userId, 'name'),
      Game.findById(offer.game, 'homeTeam awayTeam'),
    ])

    if (passenger && game) {
      const msg = `${passenger.name} הצטרף להצעת הנסיעה שלך למשחק ${game.homeTeam} נגד ${game.awayTeam}`
      await Notification.create({
        recipient: offer.driver,
        message: msg,
        relatedOffer: offer._id,
      })
      sendPushToUser(offer.driver.toString(), {
        title: 'Find The Game',
        body: msg,
      }).catch(() => {})
    }

    res.json({ offer, request })
  },
)
