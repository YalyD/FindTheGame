import axios from 'axios'

const BASE_URL = 'https://nominatim.openstreetmap.org'
const REQUEST_OPTIONS = { headers: { 'Accept-Language': 'he' } }

async function search(
  query: string,
  limit: number,
  addressDetails: boolean,
): Promise<NominatimResult[]> {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&countrycodes=il&limit=${limit}&addressdetails=${addressDetails ? 1 : 0}`
  const res = await axios.get<NominatimResult[]>(url, REQUEST_OPTIONS)
  return res.data
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

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<NominatimAddress | undefined> {
  const url = `${BASE_URL}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
  const res = await axios.get<NominatimResult>(url, REQUEST_OPTIONS)
  return res.data.address
}
