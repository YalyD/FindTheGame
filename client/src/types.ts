// Shared domain types used across pages and components.

export interface Game {
  _id: string
  homeTeam: string
  awayTeam: string
  date: string
  stadium: string
  city: string
  // Only the games list (Main) carries a competition label.
  competition?: string
}
