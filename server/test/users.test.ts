import { describe, it, expect } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { createApp } from '../src/app.js'
import { User } from '../src/models/User.js'
import { makeUser, makeIncompleteUser } from './helpers.js'

const app = createApp()

describe('GET /api/users/me', () => {
  it('returns the caller profile snapshot', async () => {
    const u = await makeUser({ name: 'Snapshot Test' })
    const res = await request(app).get('/api/users/me').set(u.authHeader)
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Snapshot Test')
    expect(res.body.favoriteTeam).toBe('מכבי תל אביב')
    expect(res.body.car).toMatchObject({ make: 'Toyota', model: 'Corolla' })
  })

  it('rejects unauthenticated', async () => {
    const res = await request(app).get('/api/users/me')
    expect(res.status).toBe(401)
  })
})

describe('PATCH /api/users/me', () => {
  it('completes a profile and returns a new JWT with profileComplete=true', async () => {
    const u = await makeIncompleteUser()

    const res = await request(app)
      .patch('/api/users/me')
      .set(u.authHeader)
      .send({
        favoriteTeam: 'הפועל באר שבע',
        address: 'Ben Gurion 10, Beer Sheva',
        car: { make: 'Mazda', model: '3', year: 2022, seats: 5 },
      })

    expect(res.status).toBe(200)
    expect(res.body.profileComplete).toBe(true)

    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET!) as {
      userId: string
      profileComplete: boolean
    }
    expect(payload.userId).toBe(u.user._id.toString())
    expect(payload.profileComplete).toBe(true)

    const saved = await User.findById(u.user._id)
    expect(saved?.favoriteTeam).toBe('הפועל באר שבע')
    expect(saved?.car?.make).toBe('Mazda')
  })

  it('rejects out-of-range car year', async () => {
    const u = await makeUser()
    const res = await request(app)
      .patch('/api/users/me')
      .set(u.authHeader)
      .send({
        favoriteTeam: 'מכבי תל אביב',
        address: 'somewhere',
        car: { make: 'Toyota', model: 'Corolla', year: 1850, seats: 5 },
      })

    expect(res.status).toBe(400)
  })

  it('rejects too-many seats', async () => {
    const u = await makeUser()
    const res = await request(app)
      .patch('/api/users/me')
      .set(u.authHeader)
      .send({
        favoriteTeam: 'מכבי תל אביב',
        address: 'somewhere',
        car: { make: 'Toyota', model: 'Corolla', year: 2020, seats: 99 },
      })
    expect(res.status).toBe(400)
  })

  it('rejects unauthenticated', async () => {
    const res = await request(app).patch('/api/users/me').send({})
    expect(res.status).toBe(401)
  })
})
