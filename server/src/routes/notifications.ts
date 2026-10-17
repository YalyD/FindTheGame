import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import * as notificationsController from '../controllers/notificationsController.js'

export const notificationsRouter = Router()

notificationsRouter.get('/', requireAuth, notificationsController.list)
notificationsRouter.patch('/read-all', requireAuth, notificationsController.markAllRead)
