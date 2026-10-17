import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimits.js'
import { idParam } from '../validators/common.js'
import {
  createOfferBody,
  editOfferBody,
  gameIdParam,
  joinBody,
  passengerBody,
} from '../validators/rideOffers.js'
import * as rideOffersController from '../controllers/rideOffersController.js'

export const rideOffersRouter = Router()

const byId = validate(idParam, 'params')

rideOffersRouter.post(
  '/',
  requireAuth,
  writeLimiter,
  validate(createOfferBody),
  rideOffersController.create,
)
rideOffersRouter.get('/mine', requireAuth, rideOffersController.listMine)
rideOffersRouter.get(
  '/game/:gameId',
  requireAuth,
  validate(gameIdParam, 'params'),
  rideOffersController.listForGame,
)

rideOffersRouter.post(
  '/:id/join',
  requireAuth,
  writeLimiter,
  byId,
  validate(joinBody),
  rideOffersController.join,
)
rideOffersRouter.post(
  '/:id/accept-passenger',
  requireAuth,
  byId,
  validate(passengerBody),
  rideOffersController.acceptPassenger,
)
rideOffersRouter.post(
  '/:id/reject-passenger',
  requireAuth,
  byId,
  validate(passengerBody),
  rideOffersController.rejectPassenger,
)

rideOffersRouter.patch(
  '/:id',
  requireAuth,
  writeLimiter,
  byId,
  validate(editOfferBody),
  rideOffersController.edit,
)
rideOffersRouter.patch('/:id/open', requireAuth, byId, rideOffersController.reopen)
rideOffersRouter.patch('/:id/cancel', requireAuth, byId, rideOffersController.cancel)
rideOffersRouter.patch('/:id/close', requireAuth, byId, rideOffersController.close)
