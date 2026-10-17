import { Game, IGame } from '../models/Game.js'

export type GameData = Pick<
  IGame,
  'homeTeam' | 'awayTeam' | 'date' | 'stadium' | 'city' | 'competition'
> & { externalId: number }

export function findById(id: unknown, fields?: string) {
  return Game.findById(id, fields)
}

export function findUpcomingForTeam(team: string) {
  return Game.find({
    date: { $gte: new Date() },
    $or: [{ homeTeam: team }, { awayTeam: team }],
  }).sort({ date: 1 })
}

export function findByExternalId(externalId: number) {
  return Game.findOne({ externalId })
}

export function findUnsyncedMatch(homeTeam: string, awayTeam: string, date: Date) {
  return Game.findOne({ externalId: { $exists: false }, homeTeam, awayTeam, date })
}

export function create(data: GameData) {
  return Game.create(data)
}

export function findBetweenExcluding(from: Date, to: Date, excludeIds: unknown[]) {
  return Game.find({ _id: { $nin: excludeIds }, date: { $gte: from, $lte: to } })
}

export function deleteById(id: unknown) {
  return Game.deleteOne({ _id: id })
}
