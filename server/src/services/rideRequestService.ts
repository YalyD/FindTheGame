import { HttpError } from '../lib/errors.js'
import * as rideRequestRepository from '../repositories/rideRequestRepository.js'
import { CreateRequestBody } from '../validators/rideRequests.js'

export async function create(passengerId: string, input: CreateRequestBody) {
  const { gameId, origin, seatsNeeded } = input

  const existing = await rideRequestRepository.findActiveForPassengerAndGame(passengerId, gameId)
  if (existing) throw new HttpError(409, 'כבר קיימת לך בקשת נסיעה למשחק זה')

  return rideRequestRepository.create({ game: gameId, passenger: passengerId, origin, seatsNeeded })
}

export async function listMine(passengerId: string) {
  const requests = await rideRequestRepository.findByPassengerWithDetails(passengerId)

  const offerIds = requests.flatMap((r) => (r.matchedOffer ? [r.matchedOffer._id] : []))
  const seatsTaken = await rideRequestRepository.seatsTakenByOffer(offerIds)

  return requests.map((r) => {
    const json = r.toJSON() as Record<string, unknown> & {
      matchedOffer?: Record<string, unknown> | null
    }
    if (json.matchedOffer) {
      json.matchedOffer.seatsTaken = seatsTaken.get(String(json.matchedOffer._id)) ?? 0
    }
    return json
  })
}

export async function cancel(passengerId: string, requestId: string) {
  const request = await rideRequestRepository.findByIdForPassenger(requestId, passengerId)
  if (!request) throw new HttpError(404, 'הבקשה לא נמצאה')
  if (request.status !== 'open') {
    throw new HttpError(409, 'לא ניתן לבטל בקשה שכבר הותאמה')
  }
  await request.deleteOne()
}
