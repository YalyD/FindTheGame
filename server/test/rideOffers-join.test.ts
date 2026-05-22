import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { RideOffer } from '../src/models/RideOffer.js'
import { RideRequest } from '../src/models/RideRequest.js'
import { Notification } from '../src/models/Notification.js'
import { makeUser, makeGame, TestUser } from './helpers.js'

const app = createApp()

async function setupMatchingScenario({
  seatsAvailable = 4,
  seatsNeeded = 2,
}: { seatsAvailable?: number; seatsNeeded?: number } = {}) {
  const driver = await makeUser({ name: 'Driver' })
  const passenger = await makeUser({ name: 'Passenger' })
  const game = await makeGame()

  const offer = await RideOffer.create({
    game: game._id,
    driver: driver.user._id,
    origin: 'Driver address',
    seatsAvailable,
  })
  const req = await RideRequest.create({
    game: game._id,
    passenger: passenger.user._id,
    origin: 'Passenger address',
    seatsNeeded,
  })

  return { driver, passenger, game, offer, request: req }
}

describe('POST /api/ride-offers/:id/join (matching engine)', () => {
  it('joins an open offer with enough seats, decrements seatsAvailable, marks request matched', async () => {
    const { passenger, offer, request: req } = await setupMatchingScenario({
      seatsAvailable: 4,
      seatsNeeded: 2,
    })

    const res = await request(app)
      .post(`/api/ride-offers/${offer._id}/join`)
      .set(passenger.authHeader)
      .send({ requestId: req._id.toString() })

    expect(res.status).toBe(200)

    const refreshedOffer = await RideOffer.findById(offer._id)
    expect(refreshedOffer?.seatsAvailable).toBe(2)
    expect(refreshedOffer?.status).toBe('open')
    expect(refreshedOffer?.passengers.map(String)).toContain(passenger.user._id.toString())

    const refreshedRequest = await RideRequest.findById(req._id)
    expect(refreshedRequest?.status).toBe('matched')
    expect(refreshedRequest?.matchedOffer?.toString()).toBe(offer._id.toString())
  })

  it('marks offer "full" when joining consumes all seats', async () => {
    const { passenger, offer, request: req } = await setupMatchingScenario({
      seatsAvailable: 2,
      seatsNeeded: 2,
    })

    const res = await request(app)
      .post(`/api/ride-offers/${offer._id}/join`)
      .set(passenger.authHeader)
      .send({ requestId: req._id.toString() })

    expect(res.status).toBe(200)

    const refreshedOffer = await RideOffer.findById(offer._id)
    expect(refreshedOffer?.seatsAvailable).toBe(0)
    expect(refreshedOffer?.status).toBe('full')
  })

  it('rejects join when not enough seats available', async () => {
    const { passenger, offer, request: req } = await setupMatchingScenario({
      seatsAvailable: 1,
      seatsNeeded: 3,
    })

    const res = await request(app)
      .post(`/api/ride-offers/${offer._id}/join`)
      .set(passenger.authHeader)
      .send({ requestId: req._id.toString() })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/מספיק מושבים/)

    const refreshedOffer = await RideOffer.findById(offer._id)
    expect(refreshedOffer?.seatsAvailable).toBe(1) // unchanged
    const refreshedRequest = await RideRequest.findById(req._id)
    expect(refreshedRequest?.status).toBe('open') // unchanged
  })

  it('rejects join when the offer belongs to a different game than the request', async () => {
    const { passenger, offer } = await setupMatchingScenario()
    const otherGame = await makeGame({ homeTeam: 'הפועל ירושלים', awayTeam: 'בית"ר ירושלים' })
    const wrongGameRequest = await RideRequest.create({
      game: otherGame._id,
      passenger: passenger.user._id,
      origin: 'Passenger address',
      seatsNeeded: 1,
    })

    const res = await request(app)
      .post(`/api/ride-offers/${offer._id}/join`)
      .set(passenger.authHeader)
      .send({ requestId: wrongGameRequest._id.toString() })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/משחקים שונים/)
  })

  it('rejects join when caller does not own the request (auth bypass attempt)', async () => {
    const { offer, request: req } = await setupMatchingScenario()
    const attacker = await makeUser({ name: 'Attacker' })

    const res = await request(app)
      .post(`/api/ride-offers/${offer._id}/join`)
      .set(attacker.authHeader)
      .send({ requestId: req._id.toString() })

    expect(res.status).toBe(403)
  })

  it('rejects joining a non-existent offer', async () => {
    const passenger = await makeUser()
    const game = await makeGame()
    const req = await RideRequest.create({
      game: game._id,
      passenger: passenger.user._id,
      origin: 'somewhere',
      seatsNeeded: 1,
    })

    const res = await request(app)
      .post('/api/ride-offers/507f1f77bcf86cd799439011/join')
      .set(passenger.authHeader)
      .send({ requestId: req._id.toString() })

    expect(res.status).toBe(404)
  })

  it('rejects joining a full offer', async () => {
    const { passenger, offer, request: req } = await setupMatchingScenario()
    offer.status = 'full'
    await offer.save()

    const res = await request(app)
      .post(`/api/ride-offers/${offer._id}/join`)
      .set(passenger.authHeader)
      .send({ requestId: req._id.toString() })

    expect(res.status).toBe(404) // offer treated as unavailable
  })

  it('rejects joining when the request is already matched', async () => {
    const { passenger, offer, request: req } = await setupMatchingScenario()
    req.status = 'matched'
    await req.save()

    const res = await request(app)
      .post(`/api/ride-offers/${offer._id}/join`)
      .set(passenger.authHeader)
      .send({ requestId: req._id.toString() })

    expect(res.status).toBe(409)
  })

  it('rejects malformed offer id', async () => {
    const passenger = await makeUser()
    const res = await request(app)
      .post('/api/ride-offers/not-an-id/join')
      .set(passenger.authHeader)
      .send({ requestId: '507f1f77bcf86cd799439011' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('validation_failed')
  })

  it('rejects missing requestId', async () => {
    const { passenger, offer } = await setupMatchingScenario()
    const res = await request(app)
      .post(`/api/ride-offers/${offer._id}/join`)
      .set(passenger.authHeader)
      .send({})

    expect(res.status).toBe(400)
  })

  it('writes a notification for the driver when join succeeds', async () => {
    const { driver, passenger, offer, request: req } = await setupMatchingScenario()

    await request(app)
      .post(`/api/ride-offers/${offer._id}/join`)
      .set(passenger.authHeader)
      .send({ requestId: req._id.toString() })

    const notifications = await Notification.find({ recipient: driver.user._id })
    expect(notifications).toHaveLength(1)
    expect(notifications[0].message).toContain(passenger.user.name)
  })

  it('requires authentication', async () => {
    const { offer, request: req } = await setupMatchingScenario()
    const res = await request(app)
      .post(`/api/ride-offers/${offer._id}/join`)
      .send({ requestId: req._id.toString() })

    expect(res.status).toBe(401)
  })
})
