import { Router, Response } from 'express'
import jwt from 'jsonwebtoken'
import { requireAuth, AuthRequest } from '../middleware/requireAuth.js'
import { User } from '../models/User.js'

export const usersRouter = Router()

usersRouter.patch('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const { favoriteTeam, address, car } = req.body as {
    favoriteTeam?: string
    address?: string
    car?: { make: string; model: string; year: number; seats: number }
  }

  const user = await User.findByIdAndUpdate(
    req.user!.userId,
    { favoriteTeam, address, car },
    { new: true },
  )

  if (!user) {
    res.status(404).json({ error: 'user not found' })
    return
  }

  const profileComplete = Boolean(user.favoriteTeam && user.address && user.car?.make)

  const token = jwt.sign(
    { userId: user._id.toString(), profileComplete },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' },
  )

  res.json({ token, profileComplete })
})
