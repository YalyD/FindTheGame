import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { MyActivity } from '../../src/pages/MyActivity'

vi.mock('axios', () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), isAxiosError: vi.fn() },
}))

const mockedGet = vi.mocked(axios.get)
const mockedPost = vi.mocked(axios.post)

const game = {
  _id: 'g1',
  homeTeam: 'מכבי תל אביב',
  awayTeam: 'הפועל חיפה',
  date: '2026-07-01T19:00:00Z',
  stadium: 'בלומפילד',
  city: 'תל אביב',
}

function offerWithPending(seatsAvailable: number, seatsNeeded: number) {
  return {
    _id: 'o1',
    game,
    origin: 'הרצל 1, חיפה',
    seatsAvailable,
    status: 'open',
    fuelCost: null,
    passengers: [],
    pendingPassengers: [
      { _id: 'p1', name: 'דנה', picture: '', phone: '050-1234567', origin: 'חיפה', seatsNeeded },
    ],
  }
}

async function acceptPendingPassenger(offer: ReturnType<typeof offerWithPending>) {
  mockedGet.mockImplementation(async (url: string) => ({
    data: url.includes('ride-offers') ? [offer] : [],
  }))
  const user = userEvent.setup()
  render(<MyActivity token="t" onViewOffers={vi.fn()} />)

  await user.click(screen.getByRole('tab', { name: /הצעות/ }))
  await user.click(await screen.findByRole('button', { name: 'אשר' }))
  expect(mockedPost).toHaveBeenCalledWith(
    '/api/ride-offers/o1/accept-passenger',
    { passengerId: 'p1' },
    expect.anything(),
  )
}

describe('MyActivity accept passenger', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPost.mockReset()
    mockedPost.mockResolvedValue({ data: { ok: true } })
  })

  it('subtracts all the seats the passenger needs', async () => {
    await acceptPendingPassenger(offerWithPending(4, 3))

    expect(await screen.findByText('1 מושבים פנויים')).toBeInTheDocument()
    expect(screen.getByText('פתוח')).toBeInTheDocument()
    expect(within(screen.getByText('נוסעים מאושרים:').parentElement!).getByText('דנה')).toBeInTheDocument()
  })

  it('marks the offer full when no seats are left', async () => {
    await acceptPendingPassenger(offerWithPending(3, 3))

    expect(await screen.findByText('0 מושבים פנויים')).toBeInTheDocument()
    expect(screen.getByText('מלא')).toBeInTheDocument()
  })
})
