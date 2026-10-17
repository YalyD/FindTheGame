import axios from 'axios'

interface Coords {
  lat: string
  lon: string
}

export async function fetchJson(url: string, timeoutMs = 5000): Promise<unknown> {
  const res = await axios.get(url, {
    timeout: timeoutMs,
    headers: { Accept: 'application/json', 'User-Agent': 'FindTheGame student project' },
  })
  return res.data
}

export async function geocode(query: string): Promise<Coords | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=il&limit=1`
    const results = (await fetchJson(url)) as Coords[]
    return results?.[0]?.lat ? results[0] : null
  } catch {
    return null
  }
}

export async function drivingDistanceKm(from: Coords, to: Coords): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`
    const data = (await fetchJson(url)) as { code?: string; routes?: { distance: number }[] }
    if (data?.code !== 'Ok' || !data.routes?.[0]) return null
    return Math.round(data.routes[0].distance / 100) / 10
  } catch {
    return null
  }
}
