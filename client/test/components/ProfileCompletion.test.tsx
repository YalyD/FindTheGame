import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { ProfileCompletion } from '../../src/pages/ProfileCompletion'

// Stub AddressFields with a plain input so we can drive the address value
// without going through MUI Autocomplete / Nominatim.
vi.mock('../../src/components/AddressFields', () => ({
  AddressFields: ({ onChange }: { onChange: (v: string) => void }) => (
    <input
      aria-label="address"
      onChange={(e) => onChange((e.target as HTMLInputElement).value)}
    />
  ),
}))

vi.mock('axios', () => ({
  default: { patch: vi.fn() },
}))

const mockedPatch = vi.mocked(axios.patch)

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox', { name: 'קבוצה אהובה' }))
  await user.click(await screen.findByRole('option', { name: 'מכבי תל אביב' }))

  await user.type(screen.getByLabelText('address'), 'הרצל 5, תל אביב')
  // MUI marks required fields with an asterisk in the label text, so match loosely.
  await user.type(screen.getByLabelText(/יצרן/), 'טויוטה')
  await user.type(screen.getByLabelText(/דגם/), 'קורולה')
  await user.type(screen.getByLabelText(/שנת ייצור/), '2020')

  await user.click(screen.getByRole('combobox', { name: 'מספר מושבים' }))
  await user.click(await screen.findByRole('option', { name: '5' }))
}

describe('ProfileCompletion', () => {
  beforeEach(() => {
    mockedPatch.mockReset()
  })

  it('renders the completion heading in create mode', () => {
    render(<ProfileCompletion token="t" onComplete={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'השלמת פרופיל' })).toBeInTheDocument()
  })

  it('keeps the submit button disabled until every field is valid', async () => {
    const user = userEvent.setup()
    render(<ProfileCompletion token="t" onComplete={vi.fn()} />)

    const submit = screen.getByRole('button', { name: 'שמור והמשך' })
    expect(submit).toBeDisabled()

    await fillValidForm(user)
    expect(submit).toBeEnabled()
  })

  it('rejects an out-of-range model year', async () => {
    const user = userEvent.setup()
    render(<ProfileCompletion token="t" onComplete={vi.fn()} />)
    await fillValidForm(user)

    const year = screen.getByLabelText(/שנת ייצור/)
    await user.clear(year)
    await user.type(year, '1980')

    expect(screen.getByRole('button', { name: 'שמור והמשך' })).toBeDisabled()
  })

  it('submits the profile and forwards the refreshed token', async () => {
    const user = userEvent.setup()
    mockedPatch.mockResolvedValue({ data: { token: 'new-token' } })
    const onComplete = vi.fn()
    render(<ProfileCompletion token="old-token" onComplete={onComplete} />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'שמור והמשך' }))

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith('new-token'))
    expect(mockedPatch).toHaveBeenCalledWith(
      '/api/users/me',
      {
        favoriteTeam: 'מכבי תל אביב',
        address: 'הרצל 5, תל אביב',
        car: { make: 'טויוטה', model: 'קורולה', year: 2020, seats: 5 },
      },
      { headers: { Authorization: 'Bearer old-token' } },
    )
  })

  it('shows an error message when the save fails', async () => {
    const user = userEvent.setup()
    mockedPatch.mockRejectedValue(new Error('boom'))
    render(<ProfileCompletion token="t" onComplete={vi.fn()} />)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'שמור והמשך' }))

    expect(await screen.findByText('שגיאה בשמירת הפרופיל, נסה שוב')).toBeInTheDocument()
  })

  it('shows edit labels and a cancel button in edit mode', () => {
    const onCancel = vi.fn()
    render(
      <ProfileCompletion
        token="t"
        onComplete={vi.fn()}
        mode="edit"
        onCancel={onCancel}
        initialProfile={{
          favoriteTeam: 'מכבי חיפה',
          address: 'בן גוריון 1, חיפה',
          car: { make: 'מאזדה', model: '3', year: 2019, seats: 5 },
        }}
      />,
    )
    expect(screen.getByRole('heading', { name: 'עריכת פרופיל' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ביטול' })).toBeInTheDocument()
  })
})
