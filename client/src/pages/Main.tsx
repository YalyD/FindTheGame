import { Box, Container, Snackbar } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { MAIN } from '../constants'
import { CreateRideRequest } from './CreateRideRequest'
import { CreateRideOffer } from './CreateRideOffer'
import { MatchScreen } from './MatchScreen'
import { MyActivity } from './MyActivity'
import { ProfileCompletion } from './ProfileCompletion'
import { AppHeader } from '../components/layout/AppHeader'
import { UpcomingGames } from '../components/game/UpcomingGames'
import { usePushSubscription } from '../hooks/usePushSubscription'
import type { Game } from '../types'

interface Props {
  token: string
  name: string
  onLogout: () => void
  onProfileUpdated: (newToken: string) => void
}

interface ProfileSnapshot {
  favoriteTeam: string
  address: string
  car: { make: string; model: string; year: number; seats: number } | null
}

export function Main({ token, name, onLogout, onProfileUpdated }: Props) {
  usePushSubscription(token)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [offerGame, setOfferGame] = useState<Game | null>(null)
  const [matchState, setMatchState] = useState<{ gameId: string; requestId: string; seatsNeeded: number } | null>(null)
  const [view, setView] = useState<'main' | 'activity'>(
    () => (localStorage.getItem('ftg_view') === 'activity' ? 'activity' : 'main'),
  )
  useEffect(() => {
    localStorage.setItem('ftg_view', view)
  }, [view])
  const [toast, setToast] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState<ProfileSnapshot | null>(null)

  async function openProfileEdit() {
    try {
      const res = await axios.get<ProfileSnapshot>('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEditingProfile(res.data)
    } catch {
      setToast(MAIN.errorLoadProfile)
    }
  }

  const loadGames = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'refresh') setRefreshing(true)
      setError(null)
      try {
        const res = await axios.get<Game[]>('/api/games', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setGames(res.data)
      } catch {
        setError(MAIN.errorLoadGames)
      } finally {
        if (mode === 'initial') setLoading(false)
        else setRefreshing(false)
      }
    },
    [token],
  )

  useEffect(() => {
    loadGames('initial')
  }, [loadGames])

  if (selectedGame) {
    return (
      <CreateRideRequest
        game={selectedGame}
        token={token}
        onSuccess={(req) => {
          setMatchState({ gameId: selectedGame._id, requestId: req._id, seatsNeeded: req.seatsNeeded })
          setSelectedGame(null)
        }}
        onCancel={() => setSelectedGame(null)}
      />
    )
  }

  if (matchState) {
    return (
      <MatchScreen
        gameId={matchState.gameId}
        requestId={matchState.requestId}
        seatsNeeded={matchState.seatsNeeded}
        token={token}
        onDone={() => {
          setMatchState(null)
          setToast(MAIN.toastRequestSaved)
        }}
      />
    )
  }

  if (offerGame) {
    return (
      <CreateRideOffer
        game={offerGame}
        token={token}
        onSuccess={() => {
          setOfferGame(null)
          setToast(MAIN.toastOfferPublished)
        }}
        onCancel={() => setOfferGame(null)}
      />
    )
  }

  if (editingProfile) {
    return (
      <ProfileCompletion
        token={token}
        mode="edit"
        initialProfile={editingProfile}
        onComplete={(newToken) => {
          onProfileUpdated(newToken)
          setEditingProfile(null)
          setToast(MAIN.toastProfileUpdated)
        }}
        onCancel={() => setEditingProfile(null)}
      />
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fff8ee 0%, #fff3d6 100%)',
        position: 'relative',
      }}
    >
      <AppHeader
        name={name}
        token={token}
        view={view}
        onSelectView={setView}
        onEditProfile={openProfileEdit}
        onLogout={onLogout}
      />

      {view === 'activity' ? (
        <Container maxWidth="sm" sx={{ py: 2 }}>
          <MyActivity token={token} />
        </Container>
      ) : (
        <UpcomingGames
          games={games}
          loading={loading}
          refreshing={refreshing}
          error={error}
          onRefresh={() => loadGames('refresh')}
          onRequestRide={setSelectedGame}
          onOfferRide={setOfferGame}
        />
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
