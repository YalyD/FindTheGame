import { describe, it, expect } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { Request, Response } from 'express'
import { createApp } from '../src/app.js'
import { errorHandler } from '../src/middleware/errorHandler.js'
import { HttpError } from '../src/lib/errors.js'
import { Game } from '../src/models/Game.js'
import { makeGame } from './helpers.js'

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

describe('errorHandler mapping', () => {
  function run(err: unknown) {
    const res = { statusCode: 0, body: undefined as unknown } as {
      statusCode: number
      body: unknown
      status: (code: number) => typeof res
      json: (body: unknown) => typeof res
    }
    res.status = (code) => ((res.statusCode = code), res)
    res.json = (body) => ((res.body = body), res)
    errorHandler(err, { method: 'GET', originalUrl: '/test' } as Request, res as unknown as Response, () => {})
    return res
  }

  it('maps HttpError to its own status', () => {
    const res = run(new HttpError(409, 'conflict'))
    expect(res.statusCode).toBe(409)
    expect(res.body).toEqual({ error: 'conflict' })
  })

  it('maps a Mongo duplicate key error to 409', async () => {
    await Game.init()
    await makeGame({ externalId: 42 })
    const err = await makeGame({ externalId: 42 }).catch((e) => e)
    expect(err.code).toBe(11000)

    const res = run(err)
    expect(res.statusCode).toBe(409)
    expect(res.body).toEqual({ error: 'duplicate' })
  })

  it('maps a Mongoose ValidationError to 400', async () => {
    const err = await new Game({}).validate().catch((e) => e)
    expect(err.name).toBe('ValidationError')

    const res = run(err)
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'validation_error' })
  })
})
