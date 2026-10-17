import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimits.js'
import { idParam } from '../validators/common.js'
import { createRequestBody } from '../validators/rideRequests.js'
import * as rideRequestsController from '../controllers/rideRequestsController.js'

export const rideRequestsRouter = Router()

rideRequestsRouter.post(
  '/',
  requireAuth,
  writeLimiter,
  validate(createRequestBody),
  rideRequestsController.create,
)
rideRequestsRouter.get('/mine', requireAuth, rideRequestsController.listMine)
rideRequestsRouter.patch(
  '/:id/cancel',
  requireAuth,
  validate(idParam, 'params'),
  rideRequestsController.cancel,
)
