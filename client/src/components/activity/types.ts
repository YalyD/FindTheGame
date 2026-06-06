import type { Game } from '../../types'

export interface PopulatedRequest {
  _id: string
  game: Game
  origin: string
  seatsNeeded: number
  status: 'open' | 'matched' | 'cancelled'
}

export interface Passenger {
  _id: string
  name: string
  picture: string
}

export interface PopulatedOffer {
  _id: string
  game: Game
  origin: string
  seatsAvailable: number
  passengers: Passenger[]
  status: 'open' | 'full' | 'cancelled'
}
