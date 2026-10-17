import { z } from 'zod'

export const subscribeBody = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(10).max(200),
    auth: z.string().min(10).max(200),
  }),
})

export type SubscribeBody = z.infer<typeof subscribeBody>
