import { env } from '../lib/env.js'
import { HttpError } from '../middleware/errorHandler.js'
import * as pushSubscriptionRepository from '../repositories/pushSubscriptionRepository.js'
import { SubscribeBody } from '../validators/push.js'

export function getVapidPublicKey() {
  const key = env().VAPID_PUBLIC_KEY
  if (!key) throw new HttpError(503, 'push_not_configured')
  return key
}

export async function subscribe(userId: string, subscription: SubscribeBody) {
  await pushSubscriptionRepository.upsert(userId, subscription)
}
