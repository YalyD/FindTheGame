import { Router, Response } from 'express'
import { Game } from '../models/Game.js'
import { User } from '../models/User.js'
import { requireAuth, AuthRequest } from '../middleware/requireAuth.js'

export const gamesRouter = Router()

gamesRouter.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.userId, 'favoriteTeam')
  if (!user?.favoriteTeam) {
    res.json([])
    return
  }

  const games = await Game.find({
    date: { $gte: new Date() },
    $or: [{ homeTeam: user.favoriteTeam }, { awayTeam: user.favoriteTeam }],
  }).sort({ date: 1 })

  res.json(games)
})
