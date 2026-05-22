import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { RideRequest } from '../src/models/RideRequest.js'
import { makeUser, makeGame } from './helpers.js'

const app = createApp()

describe('POST /api/ride-requests', () => {
  it('creates a ride request for an authenticated user', async () => {
    const u = await makeUser()
    const game = await makeGame()

    const res = await request(app)
      .post('/api/ride-requests')
      .set(u.authHeader)
      .send({ gameId: game._id.toString(), origin: 'Rothschild 1, Tel Aviv', seatsNeeded: 2 })

    expect(res.status).toBe(201)
    expect(res.body._id).toBeTruthy()
    expect(res.body.status).toBe('open')

    const saved = await RideRequest.findById(res.body._id)
    expect(saved?.passenger.toString()).toBe(u.user._id.toString())
  })

  it('rejects creation when one is already open for the same game', async () => {
    const u = await makeUser()
    const game = await makeGame()

    await request(app)
      .post('/api/ride-requests')
      .set(u.authHeader)
      .send({ gameId: game._id.toString(), origin: 'Rothschild 1', seatsNeeded: 1 })
      .expect(201)

    const res = await request(app)
      .post('/api/ride-requests')
      .set(u.authHeader)
      .send({ gameId: game._id.toString(), origin: 'Rothschild 1', seatsNeeded: 2 })

    expect(res.status).toBe(409)
  })

  it('rejects negative seats', async () => {
    const u = await makeUser()
    const game = await makeGame()

    const res = await request(app)
      .post('/api/ride-requests')
      .set(u.authHeader)
      .send({ gameId: game._id.toString(), origin: 'Rothschild 1', seatsNeeded: -3 })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('validation_failed')
  })

  it('rejects too many seats', async () => {
    const u = await makeUser()
    const game = await makeGame()

    const res = await request(app)
      .post('/api/ride-requests')
      .set(u.authHeader)
      .send({ gameId: game._id.toString(), origin: 'Rothschild 1', seatsNeeded: 999 })

    expect(res.status).toBe(400)
  })

  it('rejects malformed gameId without crashing', async () => {
    const u = await makeUser()
    const res = await request(app)
      .post('/api/ride-requests')
      .set(u.authHeader)
      .send({ gameId: 'not-an-id', origin: 'Rothschild 1', seatsNeeded: 1 })

    expect(res.status).toBe(400)
  })

  it('rejects unauthenticated calls', async () => {
    const res = await request(app)
      .post('/api/ride-requests')
      .send({ gameId: '507f1f77bcf86cd799439011', origin: 'Rothschild 1', seatsNeeded: 1 })

    expect(res.status).toBe(401)
  })
})

describe('GET /api/ride-requests/mine', () => {
  it('returns only the caller\'s requests', async () => {
    const a = await makeUser()
    const b = await makeUser()
    const game = await makeGame()

    await RideRequest.create({
      game: game._id,
      passenger: a.user._id,
      origin: 'A1',
      seatsNeeded: 1,
    })
    await RideRequest.create({
      game: game._id,
      passenger: b.user._id,
      origin: 'B1',
      seatsNeeded: 1,
    })

    const res = await request(app).get('/api/ride-requests/mine').set(a.authHeader)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].origin).toBe('A1')
  })
})

describe('PATCH /api/ride-requests/:id/cancel', () => {
  it('cancels (deletes) an open request owned by the caller', async () => {
    const u = await makeUser()
    const game = await makeGame()
    const req = await RideRequest.create({
      game: game._id,
      passenger: u.user._id,
      origin: 'A1',
      seatsNeeded: 1,
    })

    const res = await request(app).patch(`/api/ride-requests/${req._id}/cancel`).set(u.authHeader)
    expect(res.status).toBe(200)
    expect(await RideRequest.findById(req._id)).toBeNull()
  })

  it('refuses to cancel a request owned by someone else', async () => {
    const owner = await makeUser()
    const attacker = await makeUser()
    const game = await makeGame()
    const req = await RideRequest.create({
      game: game._id,
      passenger: owner.user._id,
      origin: 'A1',
      seatsNeeded: 1,
    })

    const res = await request(app)
      .patch(`/api/ride-requests/${req._id}/cancel`)
      .set(attacker.authHeader)
    expect(res.status).toBe(404)
    // ensure not deleted
    expect(await RideRequest.findById(req._id)).not.toBeNull()
  })

  it('refuses to cancel a matched request', async () => {
    const u = await makeUser()
    const game = await makeGame()
    const req = await RideRequest.create({
      game: game._id,
      passenger: u.user._id,
      origin: 'A1',
      seatsNeeded: 1,
      status: 'matched',
    })

    const res = await request(app).patch(`/api/ride-requests/${req._id}/cancel`).set(u.authHeader)
    expect(res.status).toBe(409)
  })
})
