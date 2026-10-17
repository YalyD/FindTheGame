import { describe, it, expect } from 'vitest'
import { Game } from '../src/models/Game.js'
import { RideOffer } from '../src/models/RideOffer.js'
import { RideRequest } from '../src/models/RideRequest.js'
import { applySyncedGames } from '../src/services/gameSyncService.js'
import { makeGame, makeUser } from './helpers.js'

const day = 24 * 60 * 60 * 1000
const inDays = (n: number) => new Date(Date.now() + n * day)
const window = () => ({ from: new Date(), to: inDays(30) })

function syncedGame(overrides: Partial<Parameters<typeof applySyncedGames>[0][number]> = {}) {
  return {
    externalId: 1001,
    homeTeam: 'מכבי תל אביב',
    awayTeam: 'הפועל באר שבע',
    date: inDays(7),
    stadium: 'בלומפילד',
    city: 'תל אביב',
    competition: 'ליגת העל',
    ...overrides,
  }
}

describe('applySyncedGames', () => {
  it('keeps the game id and its rides when the same game is synced again', async () => {
    const driver = await makeUser()
    await applySyncedGames([syncedGame()], window())
    const game = await Game.findOne({ externalId: 1001 })
    await RideOffer.create({ game: game!._id, driver: driver.user._id, origin: 'A', seatsAvailable: 3 })

    const result = await applySyncedGames([syncedGame()], window())

    expect(result).toMatchObject({ created: 0, updated: 1, removed: 0 })
    const again = await Game.findOne({ externalId: 1001 })
    expect(again!._id.toString()).toBe(game!._id.toString())
    expect(await RideOffer.countDocuments({ game: game!._id })).toBe(1)
  })

  it('moves a rescheduled game instead of creating a new one', async () => {
    await applySyncedGames([syncedGame({ date: inDays(7) })], window())
    const before = await Game.findOne({ externalId: 1001 })

    await applySyncedGames([syncedGame({ date: inDays(9) })], window())

    expect(await Game.countDocuments()).toBe(1)
    const after = await Game.findOne({ externalId: 1001 })
    expect(after!._id.toString()).toBe(before!._id.toString())
    expect(Math.round((after!.date.getTime() - Date.now()) / day)).toBe(9)
  })

  it('adopts an existing game created before external ids, matched by teams and date', async () => {
    const date = inDays(5)
    const legacy = await makeGame({ date })

    await applySyncedGames([syncedGame({ date })], window())

    expect(await Game.countDocuments()).toBe(1)
    const adopted = await Game.findById(legacy._id)
    expect(adopted!.externalId).toBe(1001)
  })

  it('removes a stale upcoming game with no rides', async () => {
    const stale = await makeGame({ homeTeam: 'הפועל חיפה', date: inDays(3) })

    const result = await applySyncedGames([syncedGame()], window())

    expect(result.removed).toBe(1)
    expect(await Game.findById(stale._id)).toBeNull()
  })

  it('keeps a stale game that still has rides', async () => {
    const passenger = await makeUser()
    const stale = await makeGame({ homeTeam: 'הפועל חיפה', date: inDays(3) })
    await RideRequest.create({
      game: stale._id,
      passenger: passenger.user._id,
      origin: 'Somewhere',
      seatsNeeded: 1,
    })

    const result = await applySyncedGames([syncedGame()], window())

    expect(result.removed).toBe(0)
    expect(result.keptWithRides).toHaveLength(1)
    expect(await Game.findById(stale._id)).not.toBeNull()
    expect(await RideRequest.countDocuments({ game: stale._id })).toBe(1)
  })

  it('leaves past games and games beyond the window alone', async () => {
    const past = await makeGame({ homeTeam: 'הפועל חיפה', date: inDays(-3) })
    const later = await makeGame({ homeTeam: 'בני סכנין', date: inDays(45) })

    await applySyncedGames([syncedGame()], window())

    expect(await Game.findById(past._id)).not.toBeNull()
    expect(await Game.findById(later._id)).not.toBeNull()
  })
})
