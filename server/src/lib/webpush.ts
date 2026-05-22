import webpush from 'web-push'
import mongoose from 'mongoose'
import { env } from './env.js'
import { PushSubscription } from '../models/PushSubscription.js'

export function initWebPush() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL } = env()
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_EMAIL) return
  webpush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string }) {
  const subs = await PushSubscription.find({ user: new mongoose.Types.ObjectId(userId) })
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload)),
    ),
  )
  // Clean up expired subscriptions (410 Gone / 404 Not Found)
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'rejected') {
      const code = (r.reason as { statusCode?: number })?.statusCode
      if (code === 410 || code === 404) await subs[i].deleteOne()
    }
  }
}
