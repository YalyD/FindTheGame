import { Response } from 'express'
import { AuthRequest } from '../middleware/requireAuth.js'
import * as gameService from '../services/gameService.js'

export async function listUpcoming(req: AuthRequest, res: Response) {
  res.json(await gameService.listUpcomingForUser(req.user!.userId))
}
