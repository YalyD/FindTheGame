import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import { ProfileCompletion } from './pages/ProfileCompletion'
import { Main } from './pages/Main'

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
  const [googleReady, setGoogleReady] = useState(false)
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
    return <Main token={auth.token} name={auth.name} onLogout={logout} />
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #fff3c4 0%, #ffd180 55%, #ffab40 100%)',
        py: 4,
        px: 2,
      }}
    >
      {/* decorative blurred orbs */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: -120,
          insetInlineStart: -120,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,213,79,0.85), rgba(255,213,79,0) 70%)',
          filter: 'blur(20px)',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          bottom: -140,
          insetInlineEnd: -100,
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,138,57,0.8), rgba(255,138,57,0) 70%)',
          filter: 'blur(24px)',
        }}
      />

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3.5, sm: 5 },
            borderRadius: 4,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.78)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow:
              '0 24px 60px -20px rgba(239, 108, 0, 0.28), 0 8px 24px -8px rgba(249, 168, 37, 0.22)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background:
                'linear-gradient(90deg, #fdd835 0%, #ffab40 50%, #ef6c00 100%)',
            },
          }}
        >
          <Stack spacing={1.5} sx={{ alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 84,
                height: 84,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                background:
                  'linear-gradient(135deg, #ffd54f 0%, #ffab40 55%, #ef6c00 100%)',
                boxShadow:
                  '0 12px 28px -8px rgba(239, 108, 0, 0.55), inset 0 -4px 10px rgba(0,0,0,0.08), inset 0 2px 6px rgba(255,255,255,0.5)',
              }}
            >
              <SportsSoccerIcon sx={{ fontSize: 46, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background:
                  'linear-gradient(135deg, #ef6c00 0%, #f9a825 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Find The Game
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>
              טרמפים למשחק. ביחד זה יותר כיף.
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              mb: 3.5,
            }}
          >
            <Box sx={{ flex: '0 0 auto', minWidth: 96, textAlign: 'center' }}>
              <SportsSoccerIcon
                sx={{ display: 'block', mx: 'auto', mb: 0.5, color: '#ef6c00', fontSize: 24 }}
              />
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#b53d00' }}>
                מצא טרמפים
              </Typography>
            </Box>
            <Box sx={{ flex: '0 0 auto', minWidth: 96, textAlign: 'center' }}>
              <DirectionsCarIcon
                sx={{ display: 'block', mx: 'auto', mb: 0.5, color: '#f9a825', fontSize: 24 }}
              />
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#a06600' }}>
                הצע נסיעות
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, textAlign: 'right' }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 44,
              direction: 'ltr',
            }}
          >
            <div ref={btnRef} />
            {!googleReady && !error && <CircularProgress size={24} />}
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 2.5, opacity: 0.75 }}
          >
            התחברות מאובטחת דרך חשבון Google
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}
