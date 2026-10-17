import { sendPushToUser } from '../lib/webpush.js'
import * as notificationRepository from '../repositories/notificationRepository.js'

export function listForUser(userId: string) {
  return notificationRepository.findRecentForUser(userId)
}

export async function markAllRead(userId: string) {
  await notificationRepository.markAllRead(userId)
}

export async function notify(recipientId: string, message: string, relatedOffer?: unknown) {
  await notificationRepository.create({ recipient: recipientId, message, relatedOffer })
  sendPushToUser(recipientId, { title: 'Find The Game', body: message }).catch(() => {})
}
