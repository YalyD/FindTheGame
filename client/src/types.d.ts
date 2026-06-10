// Ambient type declarations — these are global, so no import is needed
// to use them anywhere in the client.

// ---- Domain ----

interface Game {
  _id: string
  homeTeam: string
  awayTeam: string
  date: string
  stadium: string
  city: string
  // Only the games list (Main) carries a competition label.
  competition?: string
}

interface Passenger {
  _id: string
  name: string
  picture: string
}

interface Driver {
  _id: string
  name: string
  picture: string
}

// A ride request with its game populated by the server.
interface PopulatedRequest {
  _id: string
  game: Game
  origin: string
  seatsNeeded: number
  status: 'open' | 'matched' | 'cancelled'
}

// Estimated round-trip fuel cost of an offer, computed by the server at
// creation. null when the estimate failed (unknown address, API down, ...).
interface FuelCost {
  distanceKm: number
  consumption: number
  totalCost: number
}

// A ride offer with its game and passengers populated by the server.
interface PopulatedOffer {
  _id: string
  game: Game
  origin: string
  seatsAvailable: number
  passengers: Passenger[]
  status: 'open' | 'full' | 'cancelled'
  fuelCost?: FuelCost | null
}

// A ride offer as shown on the match screen, with its driver populated.
interface RideOffer {
  _id: string
  driver: Driver
  origin: string
  seatsAvailable: number
  passengers: string[]
  fuelCost?: FuelCost | null
}

// ---- FindTheGame API ----

interface AuthState {
  token: string
  name: string
  profileComplete: boolean
}

interface CarDetails {
  make: string
  model: string
  year: number
  seats: number
}

interface ProfileSnapshot {
  favoriteTeam: string
  address: string
  car: CarDetails | null
}

interface ProfileUpdate {
  favoriteTeam: string
  address: string
  car: CarDetails
}

interface CreatedRequest {
  _id: string
  seatsNeeded: number
}

interface INotification {
  _id: string
  message: string
  read: boolean
  createdAt: string
}

// ---- Nominatim geocoding service ----

interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  hamlet?: string
  municipality?: string
  road?: string
  house_number?: string
}

interface NominatimResult {
  place_id: number
  display_name: string
  address?: NominatimAddress
}
