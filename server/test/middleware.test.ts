import { describe, it, expect } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '../src/app.js'

const app = createApp()

describe('requireAuth', () => {
  it('rejects when Authorization header is missing', async () => {
    const res = await request(app).get('/api/ride-requests/mine')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('unauthorized')
  })

  it('rejects when scheme is not Bearer', async () => {
    const res = await request(app)
      .get('/api/ride-requests/mine')
      .set('Authorization', 'Basic abc:def')
    expect(res.status).toBe(401)
  })

  it('rejects expired tokens', async () => {
    const token = jwt.sign({ userId: '507f1f77bcf86cd799439011', profileComplete: true }, process.env.JWT_SECRET!, {
      expiresIn: '-1s',
    })
    const res = await request(app)
      .get('/api/ride-requests/mine')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('invalid_token')
  })

  it('rejects tokens signed with the wrong secret', async () => {
    const token = jwt.sign({ userId: '507f1f77bcf86cd799439011', profileComplete: true }, 'wrong-secret', {
      expiresIn: '1h',
    })
    const res = await request(app)
      .get('/api/ride-requests/mine')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(401)
  })
})

describe('error handler + 404', () => {
  it('returns JSON 404 for unknown routes (not nginx HTML)', async () => {
    const res = await request(app).get('/api/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'not_found' })
  })
})

describe('helmet / global headers', () => {
  it('emits standard security headers on every API response', async () => {
    const res = await request(app).get('/api/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBeTruthy()
    expect(res.headers['strict-transport-security']).toBeTruthy()
    expect(res.headers['referrer-policy']).toBeTruthy()
  })
})

describe('json body limit', () => {
  it('rejects payloads larger than 10kb', async () => {
    const huge = { credential: 'x'.repeat(20_000) }
    const res = await request(app).post('/api/auth/google').send(huge)
    expect(res.status).toBe(413)
  })
})
