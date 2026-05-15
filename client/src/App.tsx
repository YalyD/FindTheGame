import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { ProfileCompletion } from './pages/ProfileCompletion'

interface AuthState {
  token: string
  name: string
  profileComplete: boolean
}

export function App() {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const stored = localStorage.getItem('ftg_token')
    if (!stored) return null
    try {
      return JSON.parse(stored) as AuthState
    } catch {
      return null
    }
  })
  const [error, setError] = useState<string | null>(null)
  const btnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (auth) return

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
    if (!clientId) {
      setError('VITE_GOOGLE_CLIENT_ID is not set')
      return
    }

    const initGoogle = () => {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            const res = await axios.post<AuthState>('/api/auth/google', { credential })
            localStorage.setItem('ftg_token', JSON.stringify(res.data))
            setAuth(res.data)
            setError(null)
          } catch {
            setError('Login failed — check server logs')
          }
        },
      })
      if (btnRef.current) {
        google.accounts.id.renderButton(btnRef.current, { theme: 'outline', size: 'large' })
      }
    }

    if (typeof google !== 'undefined') {
      initGoogle()
    } else {
      // GIS script loads async — wait for it
      const script = document.querySelector<HTMLScriptElement>(
        'script[src*="accounts.google.com/gsi/client"]',
      )
      script?.addEventListener('load', initGoogle)
    }
  }, [auth])

  function logout() {
    localStorage.removeItem('ftg_token')
    setAuth(null)
  }

  function handleProfileComplete(newToken: string) {
    const updated = { ...auth!, token: newToken, profileComplete: true }
    localStorage.setItem('ftg_token', JSON.stringify(updated))
    setAuth(updated)
  }

  if (auth && !auth.profileComplete) {
    return <ProfileCompletion token={auth.token} onComplete={handleProfileComplete} />
  }

  if (auth) {
    return (
      <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <h1>Find The Game</h1>
        <p>Welcome, {auth.name}</p>
        <button onClick={logout}>Logout</button>
      </main>
    )
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Find The Game</h1>
      <p>Sign in to continue</p>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <div ref={btnRef} />
    </main>
  )
}
