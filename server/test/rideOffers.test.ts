import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { RideOffer } from '../src/models/RideOffer.js'
import { makeUser, makeGame } from './helpers.js'

const app = createApp()

describe('POST /api/ride-offers', () => {
  it('creates an offer', async () => {
    const u = await makeUser()
    const game = await makeGame()

    const res = await request(app)
      .post('/api/ride-offers')
      .set(u.authHeader)
      .send({ gameId: game._id.toString(), origin: 'Pickup point', seatsAvailable: 3 })

    expect(res.status).toBe(201)
    expect(res.body.driver).toBe(u.user._id.toString())
    expect(res.body.status).toBe('open')
  })

  it('rejects duplicate open offer for the same game', async () => {
    const u = await makeUser()
    const game = await makeGame()

    await request(app)
      .post('/api/ride-offers')
      .set(u.authHeader)
      .send({ gameId: game._id.toString(), origin: 'Pickup point', seatsAvailable: 3 })
      .expect(201)

    const res = await request(app)
      .post('/api/ride-offers')
      .set(u.authHeader)
      .send({ gameId: game._id.toString(), origin: 'Pickup point', seatsAvailable: 4 })

    expect(res.status).toBe(409)
  })

  it('rejects zero seats', async () => {
    const u = await makeUser()
    const game = await makeGame()
    const res = await request(app)
      .post('/api/ride-offers')
      .set(u.authHeader)
      .send({ gameId: game._id.toString(), origin: 'Pickup point', seatsAvailable: 0 })
    expect(res.status).toBe(400)
  })

  it('rejects unauthenticated', async () => {
    const res = await request(app)
      .post('/api/ride-offers')
      .send({ gameId: '507f1f77bcf86cd799439011', origin: 'Pickup', seatsAvailable: 3 })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/ride-offers/game/:gameId', () => {
  it('returns open offers for a game but hides the caller\'s own offer', async () => {
    const driver = await makeUser({ name: 'Driver A' })
    const other = await makeUser({ name: 'Driver B' })
    const game = await makeGame()

    await RideOffer.create({
      game: game._id,
      driver: driver.user._id,
      origin: 'A spot',
      seatsAvailable: 3,
    })
    await RideOffer.create({
      game: game._id,
      driver: other.user._id,
      origin: 'B spot',
      seatsAvailable: 2,
    })

    const res = await request(app)
      .get(`/api/ride-offers/game/${game._id}`)
      .set(driver.authHeader)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].origin).toBe('B spot')
  })

  it('omits cancelled and full offers', async () => {
    const driver = await makeUser()
    const passenger = await makeUser()
    const game = await makeGame()

    await RideOffer.create({
      game: game._id,
      driver: driver.user._id,
      origin: 'open',
      seatsAvailable: 3,
      status: 'open',
    })
    await RideOffer.create({
      game: game._id,
      driver: driver.user._id,
      origin: 'full',
      seatsAvailable: 0,
      status: 'full',
    })

    const res = await request(app)
      .get(`/api/ride-offers/game/${game._id}`)
      .set(passenger.authHeader)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].origin).toBe('open')
  })
})

describe('PATCH /api/ride-offers/:id/cancel', () => {
  it('cancels (deletes) an offer owned by the caller', async () => {
    const u = await makeUser()
    const game = await makeGame()
    const offer = await RideOffer.create({
      game: game._id,
      driver: u.user._id,
      origin: 'A spot',
      seatsAvailable: 3,
    })

    const res = await request(app).patch(`/api/ride-offers/${offer._id}/cancel`).set(u.authHeader)
    expect(res.status).toBe(200)
    expect(await RideOffer.findById(offer._id)).toBeNull()
  })

  it('refuses to cancel an offer owned by someone else', async () => {
    const owner = await makeUser()
    const attacker = await makeUser()
    const game = await makeGame()
    const offer = await RideOffer.create({
      game: game._id,
      driver: owner.user._id,
      origin: 'A spot',
      seatsAvailable: 3,
    })

    const res = await request(app)
      .patch(`/api/ride-offers/${offer._id}/cancel`)
      .set(attacker.authHeader)
    expect(res.status).toBe(404)
    expect(await RideOffer.findById(offer._id)).not.toBeNull()
  })
})
