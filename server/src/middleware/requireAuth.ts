import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../lib/env.js'

export interface AuthRequest extends Request {
  user?: { userId: string; profileComplete: boolean }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, env().JWT_SECRET) as {
      userId: string
      profileComplete: boolean
    }
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'invalid_token' })
  }
}
