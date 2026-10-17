export interface Coords {
  lat: number
  lon: number
}

const BASE_URL = 'https://nominatim.openstreetmap.org'
const FETCH_OPTIONS = { headers: { 'Accept-Language': 'he' } }

async function search(
  query: string,
  limit: number,
  addressDetails: boolean,
): Promise<NominatimResult[]> {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&countrycodes=il&limit=${limit}&addressdetails=${addressDetails ? 1 : 0}`
  const res = await fetch(url, FETCH_OPTIONS)
  return res.json()
}

export function cityName(address: NominatimAddress | undefined): string {
  return (
    address?.city ??
    address?.municipality ??
    address?.town ??
    address?.village ??
    address?.hamlet ??
    ''
  )
}

export async function searchCities(query: string): Promise<string[]> {
  const results = await search(query, 10, true)
  const cities = results.map((r) => cityName(r.address)).filter((name) => name !== '')
  return [...new Set(cities)]
}

export async function searchStreets(street: string, city: string): Promise<string[]> {
  const results = await search(`${street}, ${city}`, 10, true)
  const streets = results
    .map((r) => r.address?.road)
    .filter((road): road is string => !!road && road.length > 0)
  return [...new Set(streets)]
}

export async function searchAddresses(query: string): Promise<string[]> {
  const results = await search(query, 6, false)
  return results.map((r) => r.display_name)
}

export async function geocodeToCoords(address: string): Promise<Coords | null> {
  const results = await search(address, 1, false)
  const first = results[0]
  if (!first) return null
  return { lat: parseFloat(first.lat), lon: parseFloat(first.lon) }
}

export function haversineDistanceKm(a: Coords, b: Coords): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(sin2))
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<NominatimAddress | undefined> {
  const url = `${BASE_URL}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
  const res = await fetch(url, FETCH_OPTIONS)
  if (!res.ok) throw new Error('reverse geocode failed')
  const data: NominatimResult = await res.json()
  return data.address
}
