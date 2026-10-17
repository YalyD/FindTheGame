interface Coords {
  lat: string
  lon: string
}

async function fetchJson(url: string, timeoutMs = 5000): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'FindTheGame student project' },
    })
    if (!res.ok) throw new Error(`${url} responded ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
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
