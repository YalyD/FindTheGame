import { z } from 'zod'
import { objectIdSchema } from '../middleware/validate.js'

export const createOfferBody = z.object({
  gameId: objectIdSchema,
  origin: z.string().trim().min(3).max(200),
  seatsAvailable: z.number().int().min(1).max(6),
})

export const editOfferBody = z.object({
  seatsAvailable: z.number().int().min(1).max(6),
})

export const joinBody = z.object({ requestId: objectIdSchema })

export const passengerBody = z.object({ passengerId: objectIdSchema })

export const gameIdParam = z.object({ gameId: objectIdSchema })

export type CreateOfferBody = z.infer<typeof createOfferBody>
export type EditOfferBody = z.infer<typeof editOfferBody>
export type JoinBody = z.infer<typeof joinBody>
export type PassengerBody = z.infer<typeof passengerBody>
