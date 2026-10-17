interface Game {
  _id: string
  homeTeam: string
  awayTeam: string
  date: string
  stadium: string
  city: string
  competition?: string
}

interface Passenger {
  _id: string
  name: string
  picture: string
  phone: string
  origin: string
  seatsNeeded: number
}

type PendingPassenger = Passenger

interface Driver {
  _id: string
  name: string
  picture: string
}

interface MatchedDriver {
  _id: string
  name: string
  picture: string
  phone: string
  car: CarDetails | null
}

interface MatchedOffer {
  _id: string
  origin: string
  fuelCost?: FuelCost | null
  seatsTaken: number
  driver: MatchedDriver
}

interface PopulatedRequest {
  _id: string
  game: Game
  origin: string
  seatsNeeded: number
  status: 'open' | 'matched' | 'cancelled'
  matchedOffer?: MatchedOffer | null
}

interface FuelCost {
  distanceKm: number
  consumption: number
  totalCost: number
}

interface PopulatedOffer {
  _id: string
  game: Game
  origin: string
  seatsAvailable: number
  passengers: Passenger[]
  pendingPassengers: PendingPassenger[]
  status: 'open' | 'full' | 'cancelled' | 'closed'
  fuelCost?: FuelCost | null
}

interface RideOffer {
  _id: string
  driver: Driver
  origin: string
  seatsAvailable: number
  passengers: string[]
  seatsTaken: number
  requested: boolean
  fuelCost?: FuelCost | null
}

interface AuthState {
  token: string
  name: string
  profileComplete: boolean
}

interface CarDetails {
  brand: string
  model: string
  year: number
  seats: number
}

interface ProfileSnapshot {
  favoriteTeam: string
  address: string
  phone: string
  car: CarDetails | null
}

interface ProfileUpdate {
  favoriteTeam: string
  address: string
  phone?: string
  car: CarDetails
}

interface CreatedRequest {
  _id: string
  origin: string
  seatsNeeded: number
}

interface INotification {
  _id: string
  message: string
  read: boolean
  createdAt: string
}

interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  hamlet?: string
  municipality?: string
  road?: string
  house_number?: string
  country_code?: string
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: NominatimAddress
}
