import { useCallback, useEffect, useState } from 'react'
import { MAIN } from '../constants'
import { api } from '../apiHandler'
import { CreateRideRequest } from './CreateRideRequest'
import { CreateRideOffer } from './CreateRideOffer'
import { MatchScreen } from './MatchScreen'
import { ProfileCompletion } from './ProfileCompletion'
import { HomeScreen } from './HomeScreen'
import { usePushSubscription } from '../hooks/usePushSubscription'

interface Props {
  token: string
  name: string
  onLogout: () => void
  onProfileUpdated: (newToken: string) => void
}

export function Main({ token, name, onLogout, onProfileUpdated }: Props) {
  usePushSubscription(token)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openRequestGameIds, setOpenRequestGameIds] = useState<Set<string>>(new Set())
  const [openOfferGameIds, setOpenOfferGameIds] = useState<Set<string>>(new Set())
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [offerGame, setOfferGame] = useState<Game | null>(null)
  const [matchState, setMatchState] = useState<{ gameId: string; requestId: string; seatsNeeded: number; passengerOrigin: string } | null>(null)
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
      setEditingProfile(await api.users.fetchProfile(token))
    } catch {
      setToast(MAIN.errorLoadProfile)
    }
  }

  const loadGames = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'refresh') setRefreshing(true)
      setError(null)

      try {
        setGames(await api.games.fetchAll(token))
      } catch {
        setError(MAIN.errorLoadGames)
      } finally {
        if (mode === 'initial') setLoading(false)
        else setRefreshing(false)
      }

      api.rideRequests
        .fetchMine(token)
        .then((requests) =>
          setOpenRequestGameIds(
            new Set(
              requests
                .filter((r) => (r.status === 'open' || r.status === 'matched') && r.game?._id)
                .map((r) => String(r.game._id)),
            ),
          ),
        )
        .catch(() => {})

      api.rideOffers
        .fetchMine(token)
        .then((offers) =>
          setOpenOfferGameIds(
            new Set(
              offers
                .filter((o) => o.status !== 'cancelled' && o.game?._id)
                .map((o) => String(o.game._id)),
            ),
          ),
        )
        .catch(() => {})
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
          setOpenRequestGameIds((prev) => new Set([...prev, selectedGame._id]))
          setMatchState({ gameId: selectedGame._id, requestId: req._id, seatsNeeded: req.seatsNeeded, passengerOrigin: req.origin })
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
        passengerOrigin={matchState.passengerOrigin}
        token={token}
        onDone={() => {
          setMatchState(null)
          setToast(MAIN.toastRequestSaved)
          loadGames('refresh')
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
          setOpenOfferGameIds((prev) => new Set([...prev, offerGame._id]))
          setOfferGame(null)
          setToast(MAIN.toastOfferPublished)
          loadGames('refresh')
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
    <HomeScreen
      token={token}
      name={name}
      view={view}
      onSelectView={(v) => {
        setView(v)
        if (v === 'main') loadGames('refresh')
      }}
      onEditProfile={openProfileEdit}
      onLogout={onLogout}
      games={games}
      loading={loading}
      refreshing={refreshing}
      error={error}
      onRefresh={() => loadGames('refresh')}
      onRequestRide={setSelectedGame}
      onOfferRide={setOfferGame}
      onViewOffers={(req) => setMatchState({ gameId: req.game._id, requestId: req._id, seatsNeeded: req.seatsNeeded, passengerOrigin: req.origin })}
      openRequestGameIds={openRequestGameIds}
      openOfferGameIds={openOfferGameIds}
      toast={toast}
      onToastClose={() => setToast(null)}
    />
  )
}
