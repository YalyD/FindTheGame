import { useEffect, useRef, useState } from 'react'
import { ProfileCompletion } from './pages/ProfileCompletion'
import { Main } from './pages/Main'
import { LoginPage } from './pages/LoginPage'
import { LOGIN } from './constants'
import { api } from './apiHandler'

function loadStoredAuth(): AuthState | null {
  const stored = localStorage.getItem('ftg_token')
  if (!stored) return null
  try {
    return JSON.parse(stored) as AuthState
  } catch {
    localStorage.removeItem('ftg_token')
    return null
  }
}

export function App() {
  const [auth, setAuth] = useState<AuthState | null>(loadStoredAuth)
  const [error, setError] = useState<string | null>(null)
  const [googleReady, setGoogleReady] = useState(false)
  const btnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (auth) return

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
    if (!clientId) {
      setError(LOGIN.errorNoClientId)
      return
    }

    const initGoogle = () => {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            const authState = await api.auth.googleLogin(credential)
            localStorage.setItem('ftg_token', JSON.stringify(authState))
            setAuth(authState)
            setError(null)
          } catch {
            setError(LOGIN.errorLoginFailed)
          }
        },
      })
      if (btnRef.current) {
        google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 280,
        })
        setGoogleReady(true)
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
      <Main
        token={auth.token}
        name={auth.name}
        onLogout={logout}
        onProfileUpdated={handleProfileComplete}
      />
    )
  }

  return <LoginPage btnRef={btnRef} googleReady={googleReady} error={error} />
}
