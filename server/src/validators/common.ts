import { z } from 'zod'
import { objectIdSchema } from '../middleware/validate.js'

export const idParam = z.object({ id: objectIdSchema })
