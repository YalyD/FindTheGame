import { Router } from 'express'
import { dbStatus } from '../db'

export const healthRouter = Router()

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    db: dbStatus(),
    uptime: process.uptime(),
  })
})
