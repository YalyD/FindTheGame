import express from 'express'
import cors from 'cors'
import { healthRouter } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { gamesRouter } from './routes/games.js'
import { rideRequestsRouter } from './routes/rideRequests.js'
import { rideOffersRouter } from './routes/rideOffers.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    }),
  )
  app.use(express.json())

  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/games', gamesRouter)
  app.use('/api/ride-requests', rideRequestsRouter)
  app.use('/api/ride-offers', rideOffersRouter)

  return app
}
