import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { AddressFields } from '../../src/components/address/AddressFields'

const reverseGeocode = {
  address: { road: 'הרצל', house_number: '5', city: 'תל אביב', country_code: 'il' },
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
    vi.spyOn(axios, 'get').mockResolvedValue({ data: reverseGeocode })
  })

  afterEach(() => {
    vi.restoreAllMocks()
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
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/reverse?lat=32.07&lon=34.78'),
      expect.anything(),
    )
    expect(screen.getByDisplayValue('תל אביב')).toBeInTheDocument()
  })

  it('rejects a position that resolves outside Israel', async () => {
    const user = userEvent.setup()
    vi.spyOn(axios, 'get').mockResolvedValue({
      data: { address: { road: 'National Rd. D-61', city: 'בואאה', country_code: 'cm' } },
    })
    setGeolocation((success) =>
      success({ coords: { latitude: 4.15, longitude: 9.24 } } as GeolocationPosition),
    )
    const onChange = vi.fn()
    render(<AddressFields onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /מיקום/ }))

    expect(await screen.findByText(/מחוץ לישראל/)).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalledWith(expect.stringContaining('בואאה'))
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
