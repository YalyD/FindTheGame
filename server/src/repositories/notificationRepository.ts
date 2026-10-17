import { Notification } from '../models/Notification.js'

export function create(data: { recipient: unknown; message: string; relatedOffer?: unknown }) {
  return Notification.create(data)
}

export function findRecentForUser(userId: string, limit = 30) {
  return Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(limit)
}

export function markAllRead(userId: string) {
  return Notification.updateMany({ recipient: userId, read: false }, { read: true })
}
