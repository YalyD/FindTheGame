import { env } from './env.js'
import { fetchJson, geocode, drivingDistanceKm } from './routing.js'

export interface FuelCostEstimate {
  distanceKm: number
  consumption: number
  totalCost: number
}

export interface CarInfo {
  brand: string
  model: string
  year: number
}

export const DEFAULT_CONSUMPTION = 7.5

const HEBREW_BRANDS: Record<string, string> = {
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
  'וולוו': 'Volvo',
  'לקסוס': 'Lexus',
  'סובארו': 'Subaru',
  'מיני': 'MINI',
  "ג'יפ": 'Jeep',
  'אלפא רומיאו': 'Alfa Romeo',
  'יגואר': 'Jaguar',
  'לנד רובר': 'Land Rover',
  "אם.ג'י": 'MG',
  'בי.וי.די': 'BYD',
  "צ'רי": 'Chery',
}

export const OTHER_BRAND = 'אחר'

export function normalizeBrand(brand: string): string {
  const trimmed = brand.trim()
  return HEBREW_BRANDS[trimmed] ?? trimmed
}

const KNOWN_BRANDS = new Set(Object.values(HEBREW_BRANDS))

export function isKnownBrand(brand: string): boolean {
  const trimmed = brand.trim()
  return trimmed === OTHER_BRAND || KNOWN_BRANDS.has(normalizeBrand(trimmed))
}

const BRAND_TYPICAL_CONSUMPTION: Record<string, number> = {
  Suzuki: 5.5,
  Peugeot: 5.8,
  Citroen: 5.9,
  SEAT: 6.0,
  Renault: 6.0,
  Toyota: 6.0,
  Skoda: 6.2,
  Opel: 6.2,
  Dacia: 6.2,
  MINI: 6.2,
  Honda: 6.3,
  Mazda: 6.5,
  Hyundai: 6.5,
  Kia: 6.5,
  Volkswagen: 6.5,
  Nissan: 6.5,
  Lexus: 6.5,
  Ford: 6.8,
  MG: 6.8,
  Mitsubishi: 7.0,
  Chery: 7.0,
  Audi: 7.2,
  BMW: 7.2,
  Volvo: 7.2,
  'Alfa Romeo': 7.2,
  'Mercedes-Benz': 7.3,
  Jaguar: 7.8,
  Subaru: 7.8,
  Chevrolet: 8.0,
  Jeep: 8.5,
  'Land Rover': 9.0,
  Tesla: 2.5,
  BYD: 3.0,
}

export function brandTypicalConsumption(brand: string): number | undefined {
  return BRAND_TYPICAL_CONSUMPTION[normalizeBrand(brand)]
}

export function mpgToLitersPer100km(mpg: number): number {
  return Math.round((235.215 / mpg) * 10) / 10
}

export function calcTotalCost(
  distanceKm: number,
  litersPer100km: number,
  pricePerLiter: number,
): number {
  const roundTripLiters = (distanceKm * 2 * litersPer100km) / 100
  return Math.round(roundTripLiters * pricePerLiter)
}

function firstMenuValue(data: unknown): string | null {
  const menu = (data as { menuItem?: unknown })?.menuItem
  if (Array.isArray(menu)) return menu[0]?.value ?? null
  if (menu && typeof menu === 'object') return (menu as { value?: string }).value ?? null
  return null
}

export async function fetchCarConsumption(car: CarInfo): Promise<number | null> {
  try {
    const brand = encodeURIComponent(normalizeBrand(car.brand))
    const model = encodeURIComponent(car.model.trim())
    const optionsUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${car.year}&make=${brand}&model=${model}`
    const vehicleId = firstMenuValue(await fetchJson(optionsUrl))
    if (!vehicleId) return null

    const vehicle = (await fetchJson(
      `https://www.fueleconomy.gov/ws/rest/vehicle/${vehicleId}`,
    )) as { comb08?: number | string }
    const mpg = Number(vehicle?.comb08)
    if (!mpg || mpg <= 0) return null

    const litersPer100km = mpgToLitersPer100km(mpg)
    const isPlausible = litersPer100km >= 3 && litersPer100km <= 25
    if (!isPlausible) return null
    return litersPer100km
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
    const litersPer100kmPromise = car ? fetchCarConsumption(car) : Promise.resolve(null)
    const [litersPer100km, fromCoords, toCoords] = await Promise.all([
      litersPer100kmPromise,
      geocode(origin),
      geocode(`${stadium}, ${city}`).then((coords) => coords ?? geocode(city)),
    ])
    if (!fromCoords || !toCoords) return null

    const distanceKm = await drivingDistanceKm(fromCoords, toCoords)
    if (!distanceKm) return null

    const effectiveLitersPer100km =
      litersPer100km ??
      (car ? brandTypicalConsumption(car.brand) : undefined) ??
      DEFAULT_CONSUMPTION
    return {
      distanceKm,
      consumption: effectiveLitersPer100km,
      totalCost: calcTotalCost(distanceKm, effectiveLitersPer100km, env().FUEL_PRICE_ILS),
    }
  } catch {
    return null
  }
}
