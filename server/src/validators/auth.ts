import { z } from 'zod'

export const googleBody = z.object({
  credential: z.string().min(20).max(4096),
})

export type GoogleBody = z.infer<typeof googleBody>
