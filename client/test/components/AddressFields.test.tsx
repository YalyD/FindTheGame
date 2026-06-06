import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddressFields } from '../../src/components/AddressFields'

const reverseGeocode = {
  address: { road: 'הרצל', house_number: '5', city: 'תל אביב' },
}

function setGeolocation(
  impl: (success: PositionCallback, error?: PositionErrorCallback) => void,
) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition: vi.fn(impl) },
  })
}

describe('AddressFields — current location', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => reverseGeocode })) as unknown as typeof fetch,
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    // @ts-expect-error - cleaning up the property we defined
    delete navigator.geolocation
  })

  it('reverse-geocodes the current position and emits a formatted address', async () => {
    const user = userEvent.setup()
    setGeolocation((success) =>
      success({ coords: { latitude: 32.07, longitude: 34.78 } } as GeolocationPosition),
    )
    const onChange = vi.fn()
    render(<AddressFields onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /מיקום/ }))

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('הרצל 5, תל אביב'))
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reverse?lat=32.07&lon=34.78'),
      expect.anything(),
    )
    expect(screen.getByDisplayValue('תל אביב')).toBeInTheDocument()
  })

  it('warns when the browser denies location permission', async () => {
    const user = userEvent.setup()
    setGeolocation((_success, error) =>
      error?.({ code: 1 } as GeolocationPositionError),
    )
    render(<AddressFields onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /מיקום/ }))

    expect(await screen.findByText('יש לאפשר גישה למיקום בדפדפן')).toBeInTheDocument()
  })

  it('warns when geolocation is unavailable in the browser', async () => {
    const user = userEvent.setup()
    // No navigator.geolocation defined at all.
    render(<AddressFields onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /מיקום/ }))

    expect(await screen.findByText('הדפדפן לא תומך באיתור מיקום')).toBeInTheDocument()
  })
})
