import * as gameRepository from '../repositories/gameRepository.js'
import * as rideOfferRepository from '../repositories/rideOfferRepository.js'
import * as rideRequestRepository from '../repositories/rideRequestRepository.js'
import { GameData } from '../repositories/gameRepository.js'

export interface SyncResult {
  created: number
  updated: number
  removed: number
  keptWithRides: string[]
}

async function hasRides(gameId: unknown) {
  const [offers, requests] = await Promise.all([
    rideOfferRepository.existsForGame(gameId),
    rideRequestRepository.existsForGame(gameId),
  ])
  return offers || requests
}

// Games are updated in place so their ids, and the rides pointing to them, survive a sync.
export async function applySyncedGames(
  games: GameData[],
  window: { from: Date; to: Date },
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, removed: 0, keptWithRides: [] }
  const syncedIds: unknown[] = []

  for (const game of games) {
    const existing =
      (await gameRepository.findByExternalId(game.externalId)) ??
      (await gameRepository.findUnsyncedMatch(game.homeTeam, game.awayTeam, game.date))

    if (existing) {
      existing.set(game)
      await existing.save()
      syncedIds.push(existing._id)
      result.updated++
    } else {
      const created = await gameRepository.create(game)
      syncedIds.push(created._id)
      result.created++
    }
  }

  const stale = await gameRepository.findBetweenExcluding(window.from, window.to, syncedIds)
  for (const game of stale) {
    if (await hasRides(game._id)) {
      result.keptWithRides.push(`${game.homeTeam} - ${game.awayTeam}`)
      continue
    }
    await gameRepository.deleteById(game._id)
    result.removed++
  }

  return result
}
