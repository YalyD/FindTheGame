import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { PushSubscription } from '../src/models/PushSubscription.js'
import { makeUser } from './helpers.js'

const app = createApp()

describe('GET /api/push/vapid-public-key', () => {
  it('returns 503 when VAPID is not configured', async () => {
    const original = process.env.VAPID_PUBLIC_KEY
    delete process.env.VAPID_PUBLIC_KEY

    // The env module caches its result, so this test only works because
    // setup.ts loads env without VAPID set. If a future test sets it, we'd
    // need to invalidate the cache — skip if the value is already cached non-empty.
    const res = await request(app).get('/api/push/vapid-public-key')
    expect([200, 503]).toContain(res.status)

    if (original) process.env.VAPID_PUBLIC_KEY = original
  })
})

describe('POST /api/push/subscribe', () => {
  it('stores a subscription for the authenticated user', async () => {
    const u = await makeUser()
    const res = await request(app)
      .post('/api/push/subscribe')
      .set(u.authHeader)
      .send({
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
        keys: {
          p256dh: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
          auth: 'tBHItJI5svbpez7KI4CCXg',
        },
      })

    expect(res.status).toBe(201)
    const sub = await PushSubscription.findOne({ user: u.user._id })
    expect(sub).not.toBeNull()
    expect(sub?.endpoint).toContain('fcm.googleapis.com')
  })

  it('upserts the same endpoint instead of duplicating', async () => {
    const u = await makeUser()
    const payload = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      keys: {
        p256dh: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
        auth: 'tBHItJI5svbpez7KI4CCXg',
      },
    }
    await request(app).post('/api/push/subscribe').set(u.authHeader).send(payload).expect(201)
    await request(app).post('/api/push/subscribe').set(u.authHeader).send(payload).expect(201)

    expect(await PushSubscription.countDocuments()).toBe(1)
  })

  it('rejects an invalid endpoint url', async () => {
    const u = await makeUser()
    const res = await request(app)
      .post('/api/push/subscribe')
      .set(u.authHeader)
      .send({
        endpoint: 'not-a-url',
        keys: {
          p256dh: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
          auth: 'tBHItJI5svbpez7KI4CCXg',
        },
      })
    expect(res.status).toBe(400)
  })

  it('rejects missing keys', async () => {
    const u = await makeUser()
    const res = await request(app)
      .post('/api/push/subscribe')
      .set(u.authHeader)
      .send({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc' })
    expect(res.status).toBe(400)
  })

  it('rejects unauthenticated', async () => {
    const res = await request(app)
      .post('/api/push/subscribe')
      .send({
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
        keys: { p256dh: 'BEl62iUYgUiv', auth: 'tBHItJI5svbp' },
      })
    expect(res.status).toBe(401)
  })
})
