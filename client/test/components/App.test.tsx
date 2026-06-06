import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from '../../src/App'

vi.mock('../../src/pages/Main', () => ({
  Main: ({ name }: { name: string }) => <div data-testid="main">main:{name}</div>,
}))
vi.mock('../../src/pages/ProfileCompletion', () => ({
  ProfileCompletion: () => <div data-testid="profile">profile</div>,
}))
vi.mock('axios', () => ({ default: { post: vi.fn() } }))

function storeAuth(auth: { token: string; name: string; profileComplete: boolean }) {
  localStorage.setItem('ftg_token', JSON.stringify(auth))
}

describe('App routing', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('shows the login screen when there is no stored auth', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Find The Game' })).toBeInTheDocument()
    expect(screen.queryByTestId('main')).not.toBeInTheDocument()
    expect(screen.queryByTestId('profile')).not.toBeInTheDocument()
  })

  it('warns when the Google client id is not configured', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
    render(<App />)
    expect(screen.getByText('VITE_GOOGLE_CLIENT_ID is not set')).toBeInTheDocument()
  })

  it('routes to profile completion when the profile is incomplete', () => {
    storeAuth({ token: 't', name: 'יהלי', profileComplete: false })
    render(<App />)
    expect(screen.getByTestId('profile')).toBeInTheDocument()
  })

  it('routes to the main screen when the profile is complete', () => {
    storeAuth({ token: 't', name: 'יהלי', profileComplete: true })
    render(<App />)
    expect(screen.getByTestId('main')).toHaveTextContent('main:יהלי')
  })

  it('ignores corrupt auth in localStorage and shows login', () => {
    localStorage.setItem('ftg_token', 'not-json')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Find The Game' })).toBeInTheDocument()
  })
})
