import { describe, it, expect, beforeEach } from 'vitest'
import {
  DEFAULT_CONSUMPTION,
  calcTotalCost,
  estimateOfferFuelCost,
  fetchCarConsumption,
  mpgToLitersPer100km,
  normalizeMake,
} from '../src/lib/fuelCost.js'
import { mockFetch } from './setup.js'

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body }
}

const CAR = { make: 'Toyota', model: 'Corolla', year: 2020 }

beforeEach(() => {
  mockFetch.mockReset()
  mockFetch.mockRejectedValue(new Error('network disabled in tests'))
})

describe('normalizeMake', () => {
  it('maps Hebrew makes to English', () => {
    expect(normalizeMake('טויוטה')).toBe('Toyota')
    expect(normalizeMake(' מאזדה ')).toBe('Mazda')
  })

  it('passes through unknown / English makes unchanged', () => {
    expect(normalizeMake('Toyota')).toBe('Toyota')
    expect(normalizeMake('דה לוריאן')).toBe('דה לוריאן')
  })
})

describe('mpgToLitersPer100km', () => {
  it('converts US mpg to metric consumption', () => {
    expect(mpgToLitersPer100km(33)).toBeCloseTo(7.1, 1)
    expect(mpgToLitersPer100km(50)).toBeCloseTo(4.7, 1)
  })
})

describe('calcTotalCost', () => {
  it('computes round-trip liters times price', () => {
    // 100 km each way → 200 km, 7.5 L/100km → 15 L, ₪7.3/L → ₪110
    expect(calcTotalCost(100, 7.5, 7.3)).toBe(110)
  })

  it('rounds to whole shekels', () => {
    expect(calcTotalCost(10, 7.5, 7.3)).toBe(11) // 10.95 → 11
  })
})

describe('fetchCarConsumption', () => {
  it('resolves consumption via the two-step fueleconomy.gov lookup', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ menuItem: [{ text: 'Corolla', value: '41587' }] }))
      .mockResolvedValueOnce(jsonResponse({ comb08: 33 }))

    expect(await fetchCarConsumption(CAR)).toBeCloseTo(7.1, 1)
    expect(mockFetch.mock.calls[0][0]).toContain('make=Toyota')
  })

  it('handles a single menu item returned as an object', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ menuItem: { text: 'Corolla', value: '41587' } }))
      .mockResolvedValueOnce(jsonResponse({ comb08: 47 }))

    expect(await fetchCarConsumption(CAR)).toBeCloseTo(5, 1)
  })

  it('returns null when the model is not found', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}))
    expect(await fetchCarConsumption({ make: 'יונדאי', model: 'i20', year: 2019 })).toBeNull()
  })

  it('returns null on network failure', async () => {
    expect(await fetchCarConsumption(CAR)).toBeNull()
  })

  it('rejects out-of-range values', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ menuItem: [{ text: 'X', value: '1' }] }))
      .mockResolvedValueOnce(jsonResponse({ comb08: 999 }))
    expect(await fetchCarConsumption(CAR)).toBeNull()
  })
})

describe('estimateOfferFuelCost', () => {
  function mockHappyPath() {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('fueleconomy.gov/ws/rest/vehicle/menu'))
        return jsonResponse({ menuItem: [{ text: 'Corolla', value: '41587' }] })
      if (url.includes('fueleconomy.gov/ws/rest/vehicle/'))
        return jsonResponse({ comb08: 33 }) // → 7.1 L/100km
      if (url.includes('nominatim'))
        return jsonResponse([{ lat: '32.05', lon: '34.75' }])
      if (url.includes('router.project-osrm.org'))
        return jsonResponse({ code: 'Ok', routes: [{ distance: 100_000 }] }) // 100 km
      throw new Error(`unexpected url ${url}`)
    })
  }

  it('combines consumption, geocoding and routing into a total', async () => {
    mockHappyPath()
    const estimate = await estimateOfferFuelCost(CAR, 'הרצל 5, חיפה', 'בלומפילד', 'תל אביב')

    expect(estimate).not.toBeNull()
    expect(estimate!.distanceKm).toBe(100)
    expect(estimate!.consumption).toBeCloseTo(7.1, 1)
    // 200 km round trip × 7.1/100 × ₪7.3 ≈ ₪104
    expect(estimate!.totalCost).toBe(104)
  })

  it('falls back to the default consumption when the car is unknown', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('fueleconomy.gov')) throw new Error('unavailable')
      if (url.includes('nominatim')) return jsonResponse([{ lat: '32.05', lon: '34.75' }])
      if (url.includes('router.project-osrm.org'))
        return jsonResponse({ code: 'Ok', routes: [{ distance: 50_000 }] })
      throw new Error(`unexpected url ${url}`)
    })

    const estimate = await estimateOfferFuelCost(CAR, 'origin', 'stadium', 'city')
    expect(estimate!.consumption).toBe(DEFAULT_CONSUMPTION)
  })

  it('returns null when geocoding finds nothing', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('nominatim')) return jsonResponse([])
      return jsonResponse({})
    })
    expect(await estimateOfferFuelCost(CAR, 'nowhere', 'stadium', 'city')).toBeNull()
  })

  it('returns null when everything is offline', async () => {
    expect(await estimateOfferFuelCost(CAR, 'origin', 'stadium', 'city')).toBeNull()
  })
})
