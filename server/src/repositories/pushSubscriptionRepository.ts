import mongoose from 'mongoose'
import { PushSubscription } from '../models/PushSubscription.js'

export function upsert(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
) {
  return PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    { user: userId, ...subscription },
    { upsert: true, new: true },
  )
}

export function findByUser(userId: string) {
  return PushSubscription.find({ user: new mongoose.Types.ObjectId(userId) })
}
