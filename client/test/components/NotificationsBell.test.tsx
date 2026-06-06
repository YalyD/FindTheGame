import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import { NotificationsBell } from '../../src/components/notifications/NotificationsBell'

vi.mock('axios', () => ({
  default: { get: vi.fn(), patch: vi.fn() },
}))

const mockedGet = vi.mocked(axios.get)
const mockedPatch = vi.mocked(axios.patch)

function renderBell() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <NotificationsBell token="tok" />
    </QueryClientProvider>,
  )
}

describe('NotificationsBell', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPatch.mockReset()
    mockedPatch.mockResolvedValue({ data: {} })
  })

  it('shows the unread count as a badge', async () => {
    mockedGet.mockResolvedValue({
      data: [
        { _id: '1', message: 'נהג אישר', read: false, createdAt: '2026-06-06T12:00:00Z' },
        { _id: '2', message: 'נמצאה התאמה', read: true, createdAt: '2026-06-06T11:00:00Z' },
      ],
    })
    renderBell()
    expect(await screen.findByText('1')).toBeInTheDocument()
  })

  it('opens the popover and marks everything read on open', async () => {
    const user = userEvent.setup()
    mockedGet.mockResolvedValue({
      data: [
        { _id: '1', message: 'נהג אישר', read: false, createdAt: '2026-06-06T12:00:00Z' },
      ],
    })
    renderBell()

    await screen.findByText('1')
    await user.click(screen.getByRole('button', { name: 'התראות' }))

    expect(await screen.findByText('נהג אישר')).toBeInTheDocument()
    await waitFor(() =>
      expect(mockedPatch).toHaveBeenCalledWith(
        '/api/notifications/read-all',
        {},
        { headers: { Authorization: 'Bearer tok' } },
      ),
    )
  })

  it('does not mark read on open when there is nothing unread', async () => {
    const user = userEvent.setup()
    mockedGet.mockResolvedValue({
      data: [
        { _id: '2', message: 'נמצאה התאמה', read: true, createdAt: '2026-06-06T11:00:00Z' },
      ],
    })
    renderBell()

    await screen.findByText('נמצאה התאמה').catch(() => undefined)
    await user.click(screen.getByRole('button', { name: 'התראות' }))

    expect(await screen.findByText('נמצאה התאמה')).toBeInTheDocument()
    expect(mockedPatch).not.toHaveBeenCalled()
  })

  it('renders an empty state when there are no notifications', async () => {
    const user = userEvent.setup()
    mockedGet.mockResolvedValue({ data: [] })
    renderBell()

    await user.click(screen.getByRole('button', { name: 'התראות' }))
    expect(await screen.findByText('אין התראות')).toBeInTheDocument()
  })
})
