import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '../src/app.js'
import { User } from '../src/models/User.js'
import { mockGoogleVerify } from './setup.js'

const app = createApp()
const mockVerifyIdToken = mockGoogleVerify

describe('POST /api/auth/google', () => {
  beforeEach(() => {
    mockVerifyIdToken.mockReset()
  })

  it('creates a new user on first Google login and issues an app JWT', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: 'google-user-12345',
        email: 'new@example.com',
        name: 'New User',
        picture: 'https://example.com/pic.jpg',
      }),
    })

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'fake-but-long-enough-google-id-token' })

    expect(res.status).toBe(200)
    expect(res.body.profileComplete).toBe(false)
    expect(res.body.name).toBe('New User')

    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET!) as {
      userId: string
      profileComplete: boolean
    }
    expect(payload.profileComplete).toBe(false)

    const user = await User.findOne({ googleId: 'google-user-12345' })
    expect(user).not.toBeNull()
    expect(user?.email).toBe('new@example.com')
  })

  it('reuses an existing user on subsequent logins without overwriting profile', async () => {
    await User.create({
      googleId: 'returning-user',
      email: 'returning@example.com',
      name: 'Returning User',
      picture: '',
      favoriteTeam: 'מכבי תל אביב',
      address: 'somewhere',
      car: { make: 'Toyota', model: 'Corolla', year: 2020, seats: 5 },
    })

    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: 'returning-user',
        email: 'returning@example.com',
        name: 'Returning User',
        picture: '',
      }),
    })

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'fake-but-long-enough-google-id-token' })

    expect(res.status).toBe(200)
    expect(res.body.profileComplete).toBe(true)

    // confirm only one user exists (no duplicate created)
    const count = await User.countDocuments()
    expect(count).toBe(1)
  })

  it('rejects when Google verification throws', async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error('bad token'))

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'fake-but-long-enough-google-id-token' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('invalid_google_token')
  })

  it('rejects when Google payload has no sub', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ getPayload: () => null })

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'fake-but-long-enough-google-id-token' })

    expect(res.status).toBe(401)
  })

  it('rejects missing credential', async () => {
    const res = await request(app).post('/api/auth/google').send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('validation_failed')
  })

  it('rejects too-short credential', async () => {
    const res = await request(app).post('/api/auth/google').send({ credential: 'x' })
    expect(res.status).toBe(400)
  })

  it('does not expose stack traces in production mode', async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error('internal secret'))
    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'fake-but-long-enough-google-id-token' })
    expect(res.body).not.toHaveProperty('stack')
    expect(JSON.stringify(res.body)).not.toContain('at ')
  })
})
