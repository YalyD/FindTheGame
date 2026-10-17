import { HttpError } from '../lib/errors.js'
import { estimateOfferFuelCost } from '../lib/fuelCost.js'
import { geocode, drivingDistanceKm } from '../lib/routing.js'
import { IRideOffer } from '../models/RideOffer.js'
import * as rideOfferRepository from '../repositories/rideOfferRepository.js'
import * as rideRequestRepository from '../repositories/rideRequestRepository.js'
import * as userRepository from '../repositories/userRepository.js'
import * as gameRepository from '../repositories/gameRepository.js'
import * as notificationService from './notificationService.js'
import { CreateOfferBody } from '../validators/rideOffers.js'

async function findOwnOffer(offerId: string, driverId: string) {
  const offer = await rideOfferRepository.findByIdForDriver(offerId, driverId)
  if (!offer) throw new HttpError(404, 'ההצעה לא נמצאה')
  return offer
}

function removePending(offer: IRideOffer, passengerId: string) {
  offer.pendingPassengers = offer.pendingPassengers.filter(
    (p) => p.toString() !== passengerId,
  ) as typeof offer.pendingPassengers
}

async function notifyPassengerOfDecision(
  offer: IRideOffer,
  driverId: string,
  passengerId: string,
  accepted: boolean,
) {
  const [driver, game] = await Promise.all([
    userRepository.findById(driverId, 'name'),
    gameRepository.findById(offer.game, 'homeTeam awayTeam'),
  ])
  if (!driver || !game) return
  const verb = accepted ? 'אישר' : 'לא אישר'
  const msg = `${driver.name} ${verb} את הצטרפותך לנסיעה למשחק ${game.homeTeam} נגד ${game.awayTeam}`
  await notificationService.notify(passengerId, msg, offer._id)
}

export async function create(driverId: string, input: CreateOfferBody) {
  const { gameId, origin, seatsAvailable } = input

  const existing = await rideOfferRepository.findActiveForDriverAndGame(driverId, gameId)
  if (existing) throw new HttpError(409, 'כבר קיימת לך הצעת נסיעה למשחק זה')

  const [driver, game] = await Promise.all([
    userRepository.findById(driverId, 'car phone'),
    gameRepository.findById(gameId, 'stadium city'),
  ])
  if (!driver?.phone) {
    throw new HttpError(400, 'יש להוסיף מספר טלפון בפרופיל כדי לפרסם הצעת נסיעה')
  }
  if (!game) throw new HttpError(404, 'המשחק לא נמצא')

  const fuelCost = await estimateOfferFuelCost(
    driver.car,
    origin,
    game.stadium,
    game.city,
  ).catch(() => null)

  return rideOfferRepository.create({
    game: gameId,
    driver: driverId,
    origin,
    seatsAvailable,
    fuelCost,
  })
}

export async function listMine(driverId: string) {
  const offers = await rideOfferRepository.findByDriverWithDetails(driverId)

  async function withRequestDetails(gameId: unknown, people: Array<Record<string, unknown>>) {
    return Promise.all(
      (people ?? []).map(async (p) => {
        const request = await rideRequestRepository.findForPassengerAndGame(
          p._id,
          gameId,
          'origin seatsNeeded',
        )
        return { ...p, origin: request?.origin ?? '', seatsNeeded: request?.seatsNeeded ?? 1 }
      }),
    )
  }

  return Promise.all(
    offers.map(async (offer) => {
      const offerJson = offer.toJSON() as Record<string, unknown>
      offerJson.passengers = await withRequestDetails(
        offer.game,
        offerJson.passengers as Array<Record<string, unknown>>,
      )
      offerJson.pendingPassengers = await withRequestDetails(
        offer.game,
        offerJson.pendingPassengers as Array<Record<string, unknown>>,
      )
      return offerJson
    }),
  )
}

async function extraKmForPickup(
  driverOrigin: string,
  passengerCoords: { lat: string; lon: string },
  stadiumCoords: { lat: string; lon: string },
): Promise<number> {
  try {
    const driverCoords = await geocode(driverOrigin)
    if (!driverCoords) return Infinity

    const [directKm, legToPassenger, legToStadium] = await Promise.all([
      drivingDistanceKm(driverCoords, stadiumCoords),
      drivingDistanceKm(driverCoords, passengerCoords),
      drivingDistanceKm(passengerCoords, stadiumCoords),
    ])

    if (directKm === null || legToPassenger === null || legToStadium === null) return Infinity
    return legToPassenger + legToStadium - directKm
  } catch {
    return Infinity
  }
}

export async function listForGame(gameId: string, userId: string, passengerOrigin: string | null) {
  const offers = await rideOfferRepository.findOpenForGame(gameId, userId)
  const seatsTaken = await rideRequestRepository.seatsTakenByOffer(offers.map((o) => o._id))

  const serialize = (offer: (typeof offers)[number]) => ({
    ...offer.toJSON(),
    seatsTaken: seatsTaken.get(String(offer._id)) ?? 0,
    requested:
      offer.pendingPassengers.some((p) => p.toString() === userId) ||
      offer.passengers.some((p) => p.toString() === userId),
  })
  const bySeats = () =>
    offers.sort((a, b) => b.seatsAvailable - a.seatsAvailable).map(serialize)

  if (!passengerOrigin || offers.length === 0) return bySeats()

  const game = await gameRepository.findById(gameId, 'stadium city')
  if (!game) return offers.map(serialize)

  const [passengerCoords, stadiumCoords] = await Promise.all([
    geocode(passengerOrigin),
    geocode(`${game.stadium}, ${game.city}`),
  ])
  if (!passengerCoords || !stadiumCoords) return bySeats()

  const withDetour = await Promise.all(
    offers.map(async (offer) => ({
      offer,
      extraKm: await extraKmForPickup(offer.origin, passengerCoords, stadiumCoords),
    })),
  )

  return withDetour.sort((a, b) => a.extraKm - b.extraKm).map((x) => serialize(x.offer))
}

export async function join(passengerId: string, offerId: string, requestId: string) {
  const [offer, request] = await Promise.all([
    rideOfferRepository.findById(offerId),
    rideRequestRepository.findById(requestId),
  ])

  if (!offer || offer.status !== 'open') {
    throw new HttpError(404, 'ההצעה לא נמצאה או כבר מלאה')
  }
  if (!request || request.passenger.toString() !== passengerId) {
    throw new HttpError(403, 'הבקשה לא נמצאה')
  }
  if (request.status !== 'open') throw new HttpError(409, 'הבקשה כבר הותאמה')
  if (offer.game.toString() !== request.game.toString()) {
    throw new HttpError(400, 'ההצעה והבקשה הן למשחקים שונים')
  }
  if (offer.pendingPassengers.some((p) => p.toString() === passengerId)) {
    throw new HttpError(409, 'כבר שלחת בקשה להצטרף להצעה זו')
  }

  const passenger = await userRepository.findById(passengerId, 'name phone')
  if (!passenger?.phone) {
    throw new HttpError(400, 'יש להוסיף מספר טלפון בפרופיל כדי לבקש להצטרף לנסיעה')
  }

  offer.pendingPassengers.push(request.passenger)
  await offer.save()

  const game = await gameRepository.findById(offer.game, 'homeTeam awayTeam')
  if (game) {
    const msg = `${passenger.name} מבקש להצטרף לנסיעה שלך למשחק ${game.homeTeam} נגד ${game.awayTeam}`
    await notificationService.notify(offer.driver.toString(), msg, offer._id)
  }
}

export async function acceptPassenger(driverId: string, offerId: string, passengerId: string) {
  const offer = await findOwnOffer(offerId, driverId)
  if (offer.status === 'cancelled') throw new HttpError(409, 'ההצעה בוטלה')

  if (!offer.pendingPassengers.some((p) => p.toString() === passengerId)) {
    throw new HttpError(400, 'הנוסע אינו ברשימת הממתינים')
  }

  const request = await rideRequestRepository.findOpenForPassengerAndGame(passengerId, offer.game)
  if (!request) throw new HttpError(404, 'בקשת הנסיעה לא נמצאה')
  if (offer.seatsAvailable < request.seatsNeeded) {
    throw new HttpError(409, 'אין מספיק מושבים פנויים')
  }

  removePending(offer, passengerId)
  offer.passengers.push(request.passenger)
  offer.seatsAvailable -= request.seatsNeeded
  if (offer.seatsAvailable === 0) offer.status = 'full'
  await offer.save()

  request.status = 'matched'
  request.matchedOffer = offer._id as typeof request.matchedOffer
  await request.save()

  await notifyPassengerOfDecision(offer, driverId, passengerId, true)
}

export async function rejectPassenger(driverId: string, offerId: string, passengerId: string) {
  const offer = await findOwnOffer(offerId, driverId)
  removePending(offer, passengerId)
  await offer.save()

  await notifyPassengerOfDecision(offer, driverId, passengerId, false)
}

export async function edit(driverId: string, offerId: string, seatsAvailable: number) {
  const offer = await findOwnOffer(offerId, driverId)
  offer.seatsAvailable = seatsAvailable
  if (offer.status === 'full' && seatsAvailable > 0) offer.status = 'open'
  await offer.save()
  return offer
}

export async function reopen(driverId: string, offerId: string) {
  const offer = await findOwnOffer(offerId, driverId)
  if (offer.status === 'cancelled') throw new HttpError(409, 'לא ניתן לפתוח הצעה שבוטלה')
  offer.status = offer.seatsAvailable > 0 ? 'open' : 'full'
  await offer.save()
}

export async function cancel(driverId: string, offerId: string) {
  const offer = await findOwnOffer(offerId, driverId)
  if (offer.passengers.length > 0) {
    throw new HttpError(409, 'לא ניתן לבטל הצעה עם נוסעים מאושרים — יש לסגור אותה במקום')
  }
  await offer.deleteOne()
}

export async function close(driverId: string, offerId: string) {
  const offer = await findOwnOffer(offerId, driverId)
  if (offer.status === 'cancelled') throw new HttpError(409, 'לא ניתן לסגור הצעה שבוטלה')
  if (offer.status === 'closed') throw new HttpError(409, 'ההצעה כבר סגורה')
  offer.status = 'closed'
  await offer.save()
}
