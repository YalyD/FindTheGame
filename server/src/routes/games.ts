import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import * as gamesController from '../controllers/gamesController.js'

export const gamesRouter = Router()

gamesRouter.get('/', requireAuth, gamesController.listUpcoming)
