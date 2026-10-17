import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { authLimiter } from '../middleware/rateLimits.js'
import { googleBody } from '../validators/auth.js'
import * as authController from '../controllers/authController.js'

export const authRouter = Router()

authRouter.post('/google', authLimiter, validate(googleBody), authController.googleLogin)
