// All calls to the OpenStreetMap Nominatim geocoding service live here
// (address search and reverse geocoding, limited to Israel, Hebrew results).

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

// Nominatim spreads the locality name across several fields depending on
// the settlement type — take the first one that exists.
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

// Free-text search returning full display names, for single-field autocomplete.
export async function searchAddresses(query: string): Promise<string[]> {
  const results = await search(query, 6, false)
  return results.map((r) => r.display_name)
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
