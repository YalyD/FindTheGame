import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { phoneBody, profileBody } from '../validators/users.js'
import * as usersController from '../controllers/usersController.js'

export const usersRouter = Router()

usersRouter.get('/me', requireAuth, usersController.getMe)
usersRouter.patch('/me', requireAuth, validate(profileBody), usersController.updateMe)
usersRouter.patch('/me/phone', requireAuth, validate(phoneBody), usersController.updateMyPhone)
