import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { CreateRideRequest } from '../../src/pages/CreateRideRequest'

vi.mock('../../src/components/address/AddressFields', () => ({
  AddressFields: ({ onChange }: { onChange: (v: string) => void }) => (
    <input
      aria-label="origin"
      onChange={(e) => onChange((e.target as HTMLInputElement).value)}
    />
  ),
}))

vi.mock('axios', () => ({
  default: { post: vi.fn(), isAxiosError: vi.fn() },
}))

const mockedPost = vi.mocked(axios.post)
const mockedIsAxiosError = vi.mocked(axios.isAxiosError)

const game = {
  _id: 'g1',
  homeTeam: 'מכבי תל אביב',
  awayTeam: 'הפועל חיפה',
  date: '2026-07-01T19:00:00Z',
  stadium: 'בלומפילד',
  city: 'תל אביב',
}

describe('CreateRideRequest', () => {
  beforeEach(() => {
    mockedPost.mockReset()
    mockedIsAxiosError.mockReset()
    mockedIsAxiosError.mockReturnValue(false)
  })

  it('shows the game matchup in the header', () => {
    render(
      <CreateRideRequest game={game} token="t" onSuccess={vi.fn()} onCancel={vi.fn()} />,
    )
    expect(screen.getByText('מכבי תל אביב נגד הפועל חיפה')).toBeInTheDocument()
  })

  it('disables submit until the origin is longer than two characters', async () => {
    const user = userEvent.setup()
    render(
      <CreateRideRequest game={game} token="t" onSuccess={vi.fn()} onCancel={vi.fn()} />,
    )
    const submit = screen.getByRole('button', { name: 'שלח בקשה' })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText('origin'), 'ab')
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText('origin'), 'cd')
    expect(submit).toBeEnabled()
  })

  it('posts the request and forwards the created record', async () => {
    const user = userEvent.setup()
    mockedPost.mockResolvedValue({ data: { _id: 'r1', seatsNeeded: 1 } })
    const onSuccess = vi.fn()
    render(
      <CreateRideRequest game={game} token="tok" onSuccess={onSuccess} onCancel={vi.fn()} />,
    )

    await user.type(screen.getByLabelText('origin'), 'הרצל 5, חיפה')
    await user.click(screen.getByRole('button', { name: 'שלח בקשה' }))

    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith({ _id: 'r1', seatsNeeded: 1 }),
    )
    expect(mockedPost).toHaveBeenCalledWith(
      '/api/ride-requests',
      { gameId: 'g1', origin: 'הרצל 5, חיפה', seatsNeeded: 1 },
      { headers: { Authorization: 'Bearer tok' } },
    )
  })

  it('surfaces a server-provided error message', async () => {
    const user = userEvent.setup()
    mockedIsAxiosError.mockReturnValue(true)
    mockedPost.mockRejectedValue({ response: { data: { error: 'already_requested' } } })
    render(
      <CreateRideRequest game={game} token="t" onSuccess={vi.fn()} onCancel={vi.fn()} />,
    )

    await user.type(screen.getByLabelText('origin'), 'הרצל 5, חיפה')
    await user.click(screen.getByRole('button', { name: 'שלח בקשה' }))

    expect(await screen.findByText('already_requested')).toBeInTheDocument()
  })

  it('falls back to a generic error for non-axios failures', async () => {
    const user = userEvent.setup()
    mockedPost.mockRejectedValue(new Error('network'))
    render(
      <CreateRideRequest game={game} token="t" onSuccess={vi.fn()} onCancel={vi.fn()} />,
    )

    await user.type(screen.getByLabelText('origin'), 'הרצל 5, חיפה')
    await user.click(screen.getByRole('button', { name: 'שלח בקשה' }))

    expect(await screen.findByText('שגיאה ביצירת הבקשה, נסה שוב')).toBeInTheDocument()
  })

  it('calls onCancel from the cancel button', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <CreateRideRequest game={game} token="t" onSuccess={vi.fn()} onCancel={onCancel} />,
    )
    await user.click(screen.getByRole('button', { name: 'ביטול' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
