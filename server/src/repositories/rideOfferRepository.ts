import { RideOffer, IRideOffer } from '../models/RideOffer.js'

export function create(data: Pick<IRideOffer, 'origin' | 'seatsAvailable' | 'fuelCost'> & {
  game: string
  driver: string
}) {
  return RideOffer.create(data)
}

export function findById(id: string) {
  return RideOffer.findById(id)
}

export function findByIdForDriver(id: string, driverId: string) {
  return RideOffer.findOne({ _id: id, driver: driverId })
}

export function findActiveForDriverAndGame(driverId: string, gameId: string) {
  return RideOffer.findOne({
    game: gameId,
    driver: driverId,
    status: { $in: ['open', 'full', 'closed'] },
  })
}

export function findByDriverWithDetails(driverId: string) {
  return RideOffer.find({ driver: driverId })
    .populate('game')
    .populate('passengers', 'name picture phone')
    .populate('pendingPassengers', 'name picture phone')
    .sort({ createdAt: -1 })
}

export async function existsForGame(gameId: unknown): Promise<boolean> {
  return (await RideOffer.exists({ game: gameId })) !== null
}

export function findOpenForGame(gameId: string, excludeDriverId: string) {
  return RideOffer.find({
    game: gameId,
    status: 'open',
    driver: { $ne: excludeDriverId },
  }).populate('driver', 'name picture')
}
