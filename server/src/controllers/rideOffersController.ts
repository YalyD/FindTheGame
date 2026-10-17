import { Response } from 'express'
import { AuthRequest } from '../middleware/requireAuth.js'
import * as rideOfferService from '../services/rideOfferService.js'
import {
  CreateOfferBody,
  EditOfferBody,
  JoinBody,
  PassengerBody,
} from '../validators/rideOffers.js'

const offerId = (req: AuthRequest) => req.params.id as string

export async function create(req: AuthRequest, res: Response) {
  const offer = await rideOfferService.create(req.user!.userId, req.body as CreateOfferBody)
  res.status(201).json(offer)
}

export async function listMine(req: AuthRequest, res: Response) {
  res.json(await rideOfferService.listMine(req.user!.userId))
}

export async function listForGame(req: AuthRequest, res: Response) {
  const passengerOrigin =
    typeof req.query.passengerOrigin === 'string' ? req.query.passengerOrigin : null
  res.json(
    await rideOfferService.listForGame(
      req.params.gameId as string,
      req.user!.userId,
      passengerOrigin,
    ),
  )
}

export async function join(req: AuthRequest, res: Response) {
  const { requestId } = req.body as JoinBody
  await rideOfferService.join(req.user!.userId, offerId(req), requestId)
  res.json({ ok: true })
}

export async function acceptPassenger(req: AuthRequest, res: Response) {
  const { passengerId } = req.body as PassengerBody
  await rideOfferService.acceptPassenger(req.user!.userId, offerId(req), passengerId)
  res.json({ ok: true })
}

export async function rejectPassenger(req: AuthRequest, res: Response) {
  const { passengerId } = req.body as PassengerBody
  await rideOfferService.rejectPassenger(req.user!.userId, offerId(req), passengerId)
  res.json({ ok: true })
}

export async function edit(req: AuthRequest, res: Response) {
  const { seatsAvailable } = req.body as EditOfferBody
  res.json(await rideOfferService.edit(req.user!.userId, offerId(req), seatsAvailable))
}

export async function reopen(req: AuthRequest, res: Response) {
  await rideOfferService.reopen(req.user!.userId, offerId(req))
  res.json({ ok: true })
}

export async function cancel(req: AuthRequest, res: Response) {
  await rideOfferService.cancel(req.user!.userId, offerId(req))
  res.json({ ok: true })
}

export async function close(req: AuthRequest, res: Response) {
  await rideOfferService.close(req.user!.userId, offerId(req))
  res.json({ ok: true })
}
