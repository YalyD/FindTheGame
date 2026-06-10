// Estimates the round-trip fuel cost of a ride offer so it can be split
// fairly between the driver and the passengers.
//
// consumption — fueleconomy.gov vehicle API (free, no key) by the driver's
//   declared car make/model/year, with a default fallback when the model
//   isn't found (Israeli-market models are only partially covered).
// distance — Nominatim geocoding (origin + stadium) → OSRM public routing
//   server for real driving distance.
// price — FUEL_PRICE_ILS env var (₪ per liter, defaults to 7.3).
//
// Every external call is best-effort: any failure makes the whole estimate
// return null, and the offer is simply created without a fuel cost.
import { env } from './env.js'

export interface FuelCostEstimate {
  distanceKm: number
  consumption: number // liters per 100 km
  totalCost: number // ₪, round trip
}

export interface CarInfo {
  make: string
  model: string
  year: number
}

// Used when the car model can't be matched in the vehicle database —
// roughly the consumption of a typical compact family car.
export const DEFAULT_CONSUMPTION = 7.5

// Users type the make in Hebrew; the vehicle API speaks English.
const HEBREW_MAKES: Record<string, string> = {
  'טויוטה': 'Toyota',
  'מאזדה': 'Mazda',
  'מזדה': 'Mazda',
  'יונדאי': 'Hyundai',
  'קיה': 'Kia',
  'סקודה': 'Skoda',
  'פולקסווגן': 'Volkswagen',
  'הונדה': 'Honda',
  'מיצובישי': 'Mitsubishi',
  'ניסאן': 'Nissan',
  'סוזוקי': 'Suzuki',
  'פורד': 'Ford',
  'שברולט': 'Chevrolet',
  'סיאט': 'SEAT',
  'אאודי': 'Audi',
  'ב.מ.וו': 'BMW',
  'במוו': 'BMW',
  'מרצדס': 'Mercedes-Benz',
  "פיג'ו": 'Peugeot',
  'סיטרואן': 'Citroen',
  'רנו': 'Renault',
  'אופל': 'Opel',
  'טסלה': 'Tesla',
  'דאצ׳יה': 'Dacia',
  "דאצ'יה": 'Dacia',
}

export function normalizeMake(make: string): string {
  const trimmed = make.trim()
  return HEBREW_MAKES[trimmed] ?? trimmed
}

// US fuel economy is reported in miles per gallon; convert to the metric
// liters-per-100km used everywhere else (235.215 = 100 * km/mile * L/gallon).
export function mpgToLitersPer100km(mpg: number): number {
  return Math.round((235.215 / mpg) * 10) / 10
}

// Round trip: distance there and back, liters consumed, times price per liter.
export function calcTotalCost(
  distanceKm: number,
  consumption: number,
  pricePerLiter: number,
): number {
  const liters = (distanceKm * 2 * consumption) / 100
  return Math.round(liters * pricePerLiter)
}

async function fetchJson(url: string, timeoutMs = 5000): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'FindTheGame student project',
      },
    })
    if (!res.ok) throw new Error(`${url} responded ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

// fueleconomy.gov returns a single object instead of an array when a menu
// has exactly one item.
function firstMenuValue(data: unknown): string | null {
  const menu = (data as { menuItem?: unknown })?.menuItem
  if (Array.isArray(menu)) return menu[0]?.value ?? null
  if (menu && typeof menu === 'object') return (menu as { value?: string }).value ?? null
  return null
}

export async function fetchCarConsumption(car: CarInfo): Promise<number | null> {
  try {
    const make = encodeURIComponent(normalizeMake(car.make))
    const model = encodeURIComponent(car.model.trim())
    const optionsUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${car.year}&make=${make}&model=${model}`
    const vehicleId = firstMenuValue(await fetchJson(optionsUrl))
    if (!vehicleId) return null

    const vehicle = (await fetchJson(
      `https://www.fueleconomy.gov/ws/rest/vehicle/${vehicleId}`,
    )) as { comb08?: number | string }
    const mpg = Number(vehicle?.comb08)
    if (!mpg || mpg <= 0) return null

    const consumption = mpgToLitersPer100km(mpg)
    // Sanity bounds — reject nonsense values rather than produce a wild cost.
    if (consumption < 3 || consumption > 25) return null
    return consumption
  } catch {
    return null
  }
}

interface Coords {
  lat: string
  lon: string
}

async function geocode(query: string): Promise<Coords | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=il&limit=1`
    const results = (await fetchJson(url)) as Coords[]
    return results?.[0]?.lat ? results[0] : null
  } catch {
    return null
  }
}

async function fetchDrivingDistanceKm(from: Coords, to: Coords): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`
    const data = (await fetchJson(url)) as { code?: string; routes?: { distance: number }[] }
    if (data?.code !== 'Ok' || !data.routes?.[0]) return null
    return Math.round(data.routes[0].distance / 100) / 10
  } catch {
    return null
  }
}

export async function estimateOfferFuelCost(
  car: CarInfo | undefined,
  origin: string,
  stadium: string,
  city: string,
): Promise<FuelCostEstimate | null> {
  try {
    const consumptionPromise = car ? fetchCarConsumption(car) : Promise.resolve(null)
    const [consumption, fromCoords, toCoords] = await Promise.all([
      consumptionPromise,
      geocode(origin),
      geocode(`${stadium}, ${city}`).then((coords) => coords ?? geocode(city)),
    ])
    if (!fromCoords || !toCoords) return null

    const distanceKm = await fetchDrivingDistanceKm(fromCoords, toCoords)
    if (!distanceKm) return null

    const effectiveConsumption = consumption ?? DEFAULT_CONSUMPTION
    return {
      distanceKm,
      consumption: effectiveConsumption,
      totalCost: calcTotalCost(distanceKm, effectiveConsumption, env().FUEL_PRICE_ILS),
    }
  } catch {
    return null
  }
}
