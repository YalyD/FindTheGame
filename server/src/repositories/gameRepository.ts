import { Game } from '../models/Game.js'

export function findById(id: unknown, fields?: string) {
  return Game.findById(id, fields)
}

export function findUpcomingForTeam(team: string) {
  return Game.find({
    date: { $gte: new Date() },
    $or: [{ homeTeam: team }, { awayTeam: team }],
  }).sort({ date: 1 })
}
