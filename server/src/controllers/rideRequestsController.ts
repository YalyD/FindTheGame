import { Response } from 'express'
import { AuthRequest } from '../middleware/requireAuth.js'
import * as rideRequestService from '../services/rideRequestService.js'
import { CreateRequestBody } from '../validators/rideRequests.js'

export async function create(req: AuthRequest, res: Response) {
  const request = await rideRequestService.create(req.user!.userId, req.body as CreateRequestBody)
  res.status(201).json(request)
}

export async function listMine(req: AuthRequest, res: Response) {
  res.json(await rideRequestService.listMine(req.user!.userId))
}

export async function cancel(req: AuthRequest, res: Response) {
  await rideRequestService.cancel(req.user!.userId, req.params.id as string)
  res.json({ ok: true })
}
