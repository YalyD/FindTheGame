import { Router, Request, Response } from 'express'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { User } from '../models/User.js'
import { env } from '../lib/env.js'
import { validate } from '../middleware/validate.js'
import { authLimiter } from '../middleware/rateLimits.js'
import { HttpError } from '../middleware/errorHandler.js'

export const authRouter = Router()

const googleClient = new OAuth2Client(env().GOOGLE_CLIENT_ID)

const googleBody = z.object({
  credential: z.string().min(20).max(4096),
})

authRouter.post(
  '/google',
  authLimiter,
  validate(googleBody),
  async (req: Request, res: Response) => {
    const { credential } = req.body as z.infer<typeof googleBody>

    let payload
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env().GOOGLE_CLIENT_ID,
      })
      payload = ticket.getPayload()
    } catch {
      throw new HttpError(401, 'invalid_google_token')
    }
    if (!payload?.sub) {
      throw new HttpError(401, 'invalid_google_token')
    }

    const user = await User.findOneAndUpdate(
      { googleId: payload.sub },
      {
        $setOnInsert: {
          googleId: payload.sub,
          email: payload.email ?? '',
          name: payload.name ?? '',
          picture: payload.picture ?? '',
        },
      },
      { upsert: true, new: true },
    )

    const profileComplete = Boolean(user.favoriteTeam && user.address && user.car?.make)

    const token = jwt.sign(
      { userId: user._id.toString(), profileComplete },
      env().JWT_SECRET,
      { expiresIn: '7d' },
    )

    res.json({ token, profileComplete, name: user.name })
  },
)
