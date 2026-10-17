import { RideRequest } from '../models/RideRequest.js'

export async function seatsTakenByOffer(offerIds: unknown[]): Promise<Map<string, number>> {
  const rows = await RideRequest.aggregate<{ _id: unknown; seats: number }>([
    { $match: { matchedOffer: { $in: offerIds }, status: 'matched' } },
    { $group: { _id: '$matchedOffer', seats: { $sum: '$seatsNeeded' } } },
  ])
  return new Map(rows.map((row) => [String(row._id), row.seats]))
}
