import { Request, Response, NextFunction } from 'express'
import { env } from '../lib/env.js'

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'not_found' })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const isProd = env().NODE_ENV === 'production'

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message })
    return
  }

  // Mongoose CastError (invalid ObjectId arriving via a query, etc.)
  if (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'CastError') {
    res.status(400).json({ error: 'invalid_id' })
    return
  }

  // Errors thrown by Express middleware (body-parser too-large, etc.) carry a status.
  if (typeof err === 'object' && err !== null && typeof (err as { status?: number }).status === 'number') {
    const e = err as { status: number; type?: string; message?: string }
    res.status(e.status).json({ error: e.type || e.message || 'request_error' })
    return
  }

  console.error('[error]', req.method, req.originalUrl, err)
  res.status(500).json({
    error: 'internal_error',
    ...(isProd ? {} : { detail: err instanceof Error ? err.message : String(err) }),
  })
}
