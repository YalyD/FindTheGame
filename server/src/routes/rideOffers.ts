import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/requireAuth.js'
import { RideOffer } from '../models/RideOffer.js'
import { RideRequest } from '../models/RideRequest.js'
import { Notification } from '../models/Notification.js'
import { User } from '../models/User.js'
import { Game } from '../models/Game.js'
import { sendPushToUser } from '../lib/webpush.js'

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
    .populate('passengers', 'name picture')
    .sort({ createdAt: -1 })
  res.json(offers)
})

rideOffersRouter.get('/game/:gameId', requireAuth, async (req: AuthRequest, res: Response) => {
  const offers = await RideOffer.find({
    game: req.params.gameId,
    status: 'open',
    driver: { $ne: req.user!.userId },
  })
    .populate('driver', 'name picture')
    .sort({ seatsAvailable: -1, createdAt: 1 })
  res.json(offers)
})

rideOffersRouter.patch('/:id/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
  const offer = await RideOffer.findOne({ _id: req.params.id, driver: req.user!.userId })
  if (!offer) {
    res.status(404).json({ error: 'ההצעה לא נמצאה' })
    return
  }
  await offer.deleteOne()
  res.json({ ok: true })
})

rideOffersRouter.post('/:id/join', requireAuth, async (req: AuthRequest, res: Response) => {
  const { requestId } = req.body as { requestId?: string }
  if (!requestId) {
    res.status(400).json({ error: 'requestId required' })
    return
  }

  const [offer, request] = await Promise.all([
    RideOffer.findById(req.params.id),
    RideRequest.findById(requestId),
  ])

  if (!offer || offer.status !== 'open') {
    res.status(404).json({ error: 'ההצעה לא נמצאה או כבר מלאה' })
    return
  }
  if (!request || request.passenger.toString() !== req.user!.userId) {
    res.status(403).json({ error: 'הבקשה לא נמצאה' })
    return
  }
  if (request.status !== 'open') {
    res.status(409).json({ error: 'הבקשה כבר הותאמה' })
    return
  }
  if (offer.game.toString() !== request.game.toString()) {
    res.status(400).json({ error: 'ההצעה והבקשה הן למשחקים שונים' })
    return
  }
  if (offer.seatsAvailable < request.seatsNeeded) {
    res.status(409).json({ error: 'אין מספיק מושבים פנויים בהצעה זו' })
    return
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
})
