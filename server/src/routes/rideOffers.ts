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
import { geocode, drivingDistanceKm } from '../lib/routing.js'
import { seatsTakenByOffer } from '../lib/seats.js'

export const rideOffersRouter = Router()

const createBody = z.object({
  gameId: objectIdSchema,
  origin: z.string().trim().min(3).max(200),
  seatsAvailable: z.number().int().min(1).max(6),
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
      status: { $in: ['open', 'full', 'closed'] },
    })
    if (existing) throw new HttpError(409, 'כבר קיימת לך הצעת נסיעה למשחק זה')

    const [driver, game] = await Promise.all([
      User.findById(req.user!.userId, 'car phone'),
      Game.findById(gameId, 'stadium city'),
    ])
    if (!driver?.phone) {
      throw new HttpError(400, 'יש להוסיף מספר טלפון בפרופיל כדי לפרסם הצעת נסיעה')
    }
    if (!game) throw new HttpError(404, 'המשחק לא נמצא')

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
    .populate('passengers', 'name picture phone')
    .populate('pendingPassengers', 'name picture phone')
    .sort({ createdAt: -1 })

  async function withOrigin(gameId: unknown, people: Array<Record<string, unknown>>) {
    return Promise.all(
      (people ?? []).map(async (p) => {
        const request = await RideRequest.findOne(
          { game: gameId, passenger: p._id },
          'origin seatsNeeded',
        )
        return { ...p, origin: request?.origin ?? '', seatsNeeded: request?.seatsNeeded ?? 1 }
      }),
    )
  }

  const result = await Promise.all(
    offers.map(async (offer) => {
      const offerJson = offer.toJSON() as Record<string, unknown>
      offerJson.passengers = await withOrigin(
        offer.game,
        offerJson.passengers as Array<Record<string, unknown>>,
      )
      offerJson.pendingPassengers = await withOrigin(
        offer.game,
        offerJson.pendingPassengers as Array<Record<string, unknown>>,
      )
      return offerJson
    }),
  )

  res.json(result)
})

rideOffersRouter.get(
  '/game/:gameId',
  requireAuth,
  validate(gameIdParam, 'params'),
  async (req: AuthRequest, res: Response) => {
    const passengerOrigin = typeof req.query.passengerOrigin === 'string' ? req.query.passengerOrigin : null

    const userId = req.user!.userId
    const offers = await RideOffer.find({
      game: req.params.gameId,
      status: 'open',
      driver: { $ne: userId },
    }).populate('driver', 'name picture')

    const seatsTaken = await seatsTakenByOffer(offers.map((o) => o._id))

    const serialize = (offer: (typeof offers)[number]) => ({
      ...offer.toJSON(),
      seatsTaken: seatsTaken.get(String(offer._id)) ?? 0,
      requested:
        offer.pendingPassengers.some((p) => p.toString() === userId) ||
        offer.passengers.some((p) => p.toString() === userId),
    })

    if (!passengerOrigin || offers.length === 0) {
      return res.json(offers.sort((a, b) => b.seatsAvailable - a.seatsAvailable).map(serialize))
    }

    const game = await Game.findById(req.params.gameId, 'stadium city')
    if (!game) return res.json(offers.map(serialize))

    const [passengerCoords, stadiumCoords] = await Promise.all([
      geocode(passengerOrigin),
      geocode(`${game.stadium}, ${game.city}`),
    ])

    if (!passengerCoords || !stadiumCoords) {
      return res.json(offers.sort((a, b) => b.seatsAvailable - a.seatsAvailable).map(serialize))
    }

    const withDetour = await Promise.all(
      offers.map(async (offer) => {
        try {
          const driverCoords = await geocode(offer.origin)
          if (!driverCoords) return { offer, extraKm: Infinity }

          const [directKm, legToPassenger, legToStadium] = await Promise.all([
            drivingDistanceKm(driverCoords, stadiumCoords),
            drivingDistanceKm(driverCoords, passengerCoords),
            drivingDistanceKm(passengerCoords, stadiumCoords),
          ])

          if (directKm === null || legToPassenger === null || legToStadium === null) {
            return { offer, extraKm: Infinity }
          }

          return { offer, extraKm: legToPassenger + legToStadium - directKm }
        } catch {
          return { offer, extraKm: Infinity }
        }
      }),
    )

    res.json(withDetour.sort((a, b) => a.extraKm - b.extraKm).map((x) => serialize(x.offer)))
  },
)

const passengerBody = z.object({ passengerId: objectIdSchema })

rideOffersRouter.post(
  '/:id/accept-passenger',
  requireAuth,
  validate(idParam, 'params'),
  validate(passengerBody),
  async (req: AuthRequest, res: Response) => {
    const { passengerId } = req.body as z.infer<typeof passengerBody>

    const offer = await RideOffer.findOne({ _id: req.params.id, driver: req.user!.userId })
    if (!offer) throw new HttpError(404, 'ההצעה לא נמצאה')
    if (offer.status === 'cancelled') throw new HttpError(409, 'ההצעה בוטלה')

    if (!offer.pendingPassengers.some((p) => p.toString() === passengerId)) {
      throw new HttpError(400, 'הנוסע אינו ברשימת הממתינים')
    }

    const request = await RideRequest.findOne({
      game: offer.game,
      passenger: passengerId,
      status: 'open',
    })
    if (!request) throw new HttpError(404, 'בקשת הנסיעה לא נמצאה')
    if (offer.seatsAvailable < request.seatsNeeded) {
      throw new HttpError(409, 'אין מספיק מושבים פנויים')
    }

    offer.pendingPassengers = offer.pendingPassengers.filter(
      (p) => p.toString() !== passengerId,
    ) as typeof offer.pendingPassengers
    offer.passengers.push(request.passenger)
    offer.seatsAvailable -= request.seatsNeeded
    if (offer.seatsAvailable === 0) offer.status = 'full'
    await offer.save()

    request.status = 'matched'
    request.matchedOffer = offer._id as typeof request.matchedOffer
    await request.save()

    const [driver, game] = await Promise.all([
      User.findById(req.user!.userId, 'name'),
      Game.findById(offer.game, 'homeTeam awayTeam'),
    ])
    if (driver && game) {
      const msg = `${driver.name} אישר את הצטרפותך לנסיעה למשחק ${game.homeTeam} נגד ${game.awayTeam}`
      await Notification.create({ recipient: passengerId, message: msg, relatedOffer: offer._id })
      sendPushToUser(passengerId, { title: 'Find The Game', body: msg }).catch(() => {})
    }

    res.json({ ok: true })
  },
)

rideOffersRouter.post(
  '/:id/reject-passenger',
  requireAuth,
  validate(idParam, 'params'),
  validate(passengerBody),
  async (req: AuthRequest, res: Response) => {
    const { passengerId } = req.body as z.infer<typeof passengerBody>

    const offer = await RideOffer.findOne({ _id: req.params.id, driver: req.user!.userId })
    if (!offer) throw new HttpError(404, 'ההצעה לא נמצאה')

    offer.pendingPassengers = offer.pendingPassengers.filter(
      (p) => p.toString() !== passengerId,
    ) as typeof offer.pendingPassengers
    await offer.save()

    const [driver, game] = await Promise.all([
      User.findById(req.user!.userId, 'name'),
      Game.findById(offer.game, 'homeTeam awayTeam'),
    ])
    if (driver && game) {
      const msg = `${driver.name} לא אישר את הצטרפותך לנסיעה למשחק ${game.homeTeam} נגד ${game.awayTeam}`
      await Notification.create({ recipient: passengerId, message: msg, relatedOffer: offer._id })
      sendPushToUser(passengerId, { title: 'Find The Game', body: msg }).catch(() => {})
    }

    res.json({ ok: true })
  },
)

const editBody = z.object({
  seatsAvailable: z.number().int().min(1).max(6),
})

rideOffersRouter.patch(
  '/:id',
  requireAuth,
  writeLimiter,
  validate(idParam, 'params'),
  validate(editBody),
  async (req: AuthRequest, res: Response) => {
    const { seatsAvailable } = req.body as z.infer<typeof editBody>

    const offer = await RideOffer.findOne({ _id: req.params.id, driver: req.user!.userId })
    if (!offer) throw new HttpError(404, 'ההצעה לא נמצאה')

    offer.seatsAvailable = seatsAvailable
    if (offer.status === 'full' && seatsAvailable > 0) offer.status = 'open'
    await offer.save()

    res.json(offer)
  },
)

rideOffersRouter.patch(
  '/:id/open',
  requireAuth,
  validate(idParam, 'params'),
  async (req: AuthRequest, res: Response) => {
    const offer = await RideOffer.findOne({ _id: req.params.id, driver: req.user!.userId })
    if (!offer) throw new HttpError(404, 'ההצעה לא נמצאה')
    if (offer.status === 'cancelled') throw new HttpError(409, 'לא ניתן לפתוח הצעה שבוטלה')
    offer.status = offer.seatsAvailable > 0 ? 'open' : 'full'
    await offer.save()
    res.json({ ok: true })
  },
)

rideOffersRouter.patch(
  '/:id/cancel',
  requireAuth,
  validate(idParam, 'params'),
  async (req: AuthRequest, res: Response) => {
    const offer = await RideOffer.findOne({ _id: req.params.id, driver: req.user!.userId })
    if (!offer) throw new HttpError(404, 'ההצעה לא נמצאה')
    if (offer.passengers.length > 0) {
      throw new HttpError(409, 'לא ניתן לבטל הצעה עם נוסעים מאושרים — יש לסגור אותה במקום')
    }
    await offer.deleteOne()
    res.json({ ok: true })
  },
)

rideOffersRouter.patch(
  '/:id/close',
  requireAuth,
  validate(idParam, 'params'),
  async (req: AuthRequest, res: Response) => {
    const offer = await RideOffer.findOne({ _id: req.params.id, driver: req.user!.userId })
    if (!offer) throw new HttpError(404, 'ההצעה לא נמצאה')
    if (offer.status === 'cancelled') throw new HttpError(409, 'לא ניתן לסגור הצעה שבוטלה')
    if (offer.status === 'closed') throw new HttpError(409, 'ההצעה כבר סגורה')
    offer.status = 'closed'
    await offer.save()
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
    if (offer.pendingPassengers.some((p) => p.toString() === req.user!.userId)) {
      throw new HttpError(409, 'כבר שלחת בקשה להצטרף להצעה זו')
    }

    const passenger = await User.findById(req.user!.userId, 'name phone')
    if (!passenger?.phone) {
      throw new HttpError(400, 'יש להוסיף מספר טלפון בפרופיל כדי לבקש להצטרף לנסיעה')
    }

    offer.pendingPassengers.push(request.passenger)
    await offer.save()

    const game = await Game.findById(offer.game, 'homeTeam awayTeam')

    if (passenger && game) {
      const msg = `${passenger.name} מבקש להצטרף לנסיעה שלך למשחק ${game.homeTeam} נגד ${game.awayTeam}`
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

    res.json({ ok: true })
  },
)
