import { RideRequest } from '../models/RideRequest.js'

export function create(data: {
  game: string
  passenger: string
  origin: string
  seatsNeeded: number
}) {
  return RideRequest.create(data)
}

export function findById(id: string) {
  return RideRequest.findById(id)
}

export function findByIdForPassenger(id: string, passengerId: string) {
  return RideRequest.findOne({ _id: id, passenger: passengerId })
}

export function findActiveForPassengerAndGame(passengerId: string, gameId: string) {
  return RideRequest.findOne({
    game: gameId,
    passenger: passengerId,
    status: { $in: ['open', 'matched'] },
  })
}

export function findOpenForPassengerAndGame(passengerId: string, gameId: unknown) {
  return RideRequest.findOne({ game: gameId, passenger: passengerId, status: 'open' })
}

export function findForPassengerAndGame(passengerId: unknown, gameId: unknown, fields?: string) {
  return RideRequest.findOne({ game: gameId, passenger: passengerId }, fields)
}

export function findByPassengerWithDetails(passengerId: string) {
  return RideRequest.find({ passenger: passengerId })
    .populate('game')
    .populate({
      path: 'matchedOffer',
      select: 'origin fuelCost driver',
      populate: { path: 'driver', select: 'name picture phone car' },
    })
    .sort({ createdAt: -1 })
}

export async function seatsTakenByOffer(offerIds: unknown[]): Promise<Map<string, number>> {
  const rows = await RideRequest.aggregate<{ _id: unknown; seats: number }>([
    { $match: { matchedOffer: { $in: offerIds }, status: 'matched' } },
    { $group: { _id: '$matchedOffer', seats: { $sum: '$seatsNeeded' } } },
  ])
  return new Map(rows.map((row) => [String(row._id), row.seats]))
}
