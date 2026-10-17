import { z } from 'zod'
import { objectIdSchema } from '../middleware/validate.js'

export const createRequestBody = z.object({
  gameId: objectIdSchema,
  origin: z.string().trim().min(3).max(200),
  seatsNeeded: z.number().int().min(1).max(6),
})

export type CreateRequestBody = z.infer<typeof createRequestBody>
