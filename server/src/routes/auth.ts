import { Router, Request, Response } from 'express'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

export const authRouter = Router()

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

authRouter.post('/google', async (req: Request, res: Response) => {
  const { credential } = req.body as { credential?: string }
  if (!credential) {
    res.status(400).json({ error: 'credential required' })
    return
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  })
  const payload = ticket.getPayload()
  if (!payload?.sub) {
    res.status(401).json({ error: 'invalid google token' })
    return
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
    process.env.JWT_SECRET!,
    { expiresIn: '7d' },
  )

  res.json({ token, profileComplete, name: user.name })
})
