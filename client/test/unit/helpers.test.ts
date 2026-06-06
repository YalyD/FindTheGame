import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseAddress } from '../../src/components/address/AddressFields'
import { urlBase64ToUint8Array } from '../../src/hooks/usePushSubscription'
import { timeAgo } from '../../src/components/notifications/NotificationsBell'

describe('parseAddress', () => {
  it('returns empty fields for an empty string', () => {
    expect(parseAddress('')).toEqual({ city: '', street: '', houseNumber: '' })
  })

  it('returns empty fields when there is no city separator', () => {
    expect(parseAddress('הרצל')).toEqual({ city: '', street: '', houseNumber: '' })
  })

  it('splits "Street House, City" into three fields', () => {
    expect(parseAddress('הרצל 5, תל אביב')).toEqual({
      city: 'תל אביב',
      street: 'הרצל',
      houseNumber: '5',
    })
  })

  it('handles multi-word streets', () => {
    expect(parseAddress('דרך השלום 12, רמת גן')).toEqual({
      city: 'רמת גן',
      street: 'דרך השלום',
      houseNumber: '12',
    })
  })

  it('recovers a city even when no house number is present', () => {
    expect(parseAddress('הרצל, חיפה')).toEqual({
      city: 'חיפה',
      street: 'הרצל',
      houseNumber: '',
    })
  })

  it('keeps commas that belong to the city portion', () => {
    expect(parseAddress('הרצל 5, קריית אונו, מחוז תל אביב')).toEqual({
      city: 'קריית אונו, מחוז תל אביב',
      street: 'הרצל',
      houseNumber: '5',
    })
  })

  it('accepts house numbers with a trailing letter (e.g. 5א)', () => {
    expect(parseAddress('הרצל 5א, תל אביב')).toEqual({
      city: 'תל אביב',
      street: 'הרצל',
      houseNumber: '5א',
    })
  })
})

describe('urlBase64ToUint8Array', () => {
  it('decodes a standard base64url string to the matching bytes', () => {
    // "hi" base64 is "aGk=", base64url drops padding -> "aGk"
    const out = urlBase64ToUint8Array('aGk')
    expect(Array.from(out)).toEqual([104, 105])
  })

  it('translates the URL-safe alphabet (- and _) back to + and /', () => {
    const bytes = new Uint8Array([0xfb, 0xff, 0xbf])
    // 0xfb 0xff 0xbf -> standard base64 "+/+/", url-safe "-_-_"
    const out = urlBase64ToUint8Array('-_-_')
    expect(Array.from(out)).toEqual(Array.from(bytes))
  })

  it('round-trips a realistic VAPID-length key without throwing', () => {
    const raw = Array.from({ length: 65 }, (_, i) => i)
    const b64url = btoa(String.fromCharCode(...raw))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(Array.from(urlBase64ToUint8Array(b64url))).toEqual(raw)
  })
})

describe('timeAgo', () => {
  afterEach(() => vi.useRealTimers())

  function at(now: string) {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(now))
  }

  it('shows "now" for under a minute', () => {
    at('2026-06-06T12:00:30Z')
    expect(timeAgo('2026-06-06T12:00:00Z')).toBe('עכשיו')
  })

  it('shows minutes for under an hour', () => {
    at('2026-06-06T12:30:00Z')
    expect(timeAgo('2026-06-06T12:00:00Z')).toBe('לפני 30 דקות')
  })

  it('shows hours for under a day', () => {
    at('2026-06-06T15:00:00Z')
    expect(timeAgo('2026-06-06T12:00:00Z')).toBe('לפני 3 שעות')
  })

  it('shows days beyond 24 hours', () => {
    at('2026-06-09T12:00:00Z')
    expect(timeAgo('2026-06-06T12:00:00Z')).toBe('לפני 3 ימים')
  })
})
