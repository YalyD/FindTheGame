import { Router, Request, Response } from 'express'
import { Game } from '../models/Game.js'

export const gamesRouter = Router()

gamesRouter.get('/', async (_req: Request, res: Response) => {
  const games = await Game.find({ date: { $gte: new Date() } }).sort({ date: 1 })
  res.json(games)
})
