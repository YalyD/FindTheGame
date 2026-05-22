import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './lib/env.js'
import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { gamesRouter } from './routes/games.js'
import { rideRequestsRouter } from './routes/rideRequests.js'
import { rideOffersRouter } from './routes/rideOffers.js'
import { notificationsRouter } from './routes/notifications.js'
import { pushRouter } from './routes/push.js'
import { apiLimiter } from './middleware/rateLimits.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()
  const { CLIENT_ORIGIN } = env()

  // X-Forwarded-* headers from nginx; required for rate-limiter IP detection in prod
  app.set('trust proxy', 1)

  app.use(
    helmet({
      // The frontend is served from a separate origin in dev (Vite) and proxied
      // by nginx in prod, so CSP is set at the nginx layer. Disable here to
      // avoid blocking the React app during dev.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  )

  app.use(
    cors({
      origin: CLIENT_ORIGIN,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    }),
  )

  app.use(express.json({ limit: '10kb' }))

  app.use('/api', apiLimiter)

  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/games', gamesRouter)
  app.use('/api/ride-requests', rideRequestsRouter)
  app.use('/api/ride-offers', rideOffersRouter)
  app.use('/api/notifications', notificationsRouter)
  app.use('/api/push', pushRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
