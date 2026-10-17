import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { writeLimiter } from '../middleware/rateLimits.js'
import { subscribeBody } from '../validators/push.js'
import * as pushController from '../controllers/pushController.js'

export const pushRouter = Router()

pushRouter.get('/vapid-public-key', pushController.getVapidPublicKey)
pushRouter.post(
  '/subscribe',
  requireAuth,
  writeLimiter,
  validate(subscribeBody),
  pushController.subscribe,
)
