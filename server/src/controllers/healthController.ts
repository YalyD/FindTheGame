import { Request, Response } from 'express'
import { dbStatus } from '../db.js'

export function getHealth(_req: Request, res: Response) {
  res.json({
    status: 'ok',
    db: dbStatus(),
    uptime: process.uptime(),
  })
}
