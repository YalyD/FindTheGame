import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  Skeleton,
  Snackbar,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import LogoutIcon from '@mui/icons-material/Logout'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import RefreshIcon from '@mui/icons-material/Refresh'
import EditIcon from '@mui/icons-material/Edit'
import { Menu, MenuItem } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { CreateRideRequest } from './CreateRideRequest'
import { CreateRideOffer } from './CreateRideOffer'
import { MatchScreen } from './MatchScreen'
import { MyActivity } from './MyActivity'
import { ProfileCompletion } from './ProfileCompletion'
import { NotificationsBell } from '../components/NotificationsBell'
import { usePushSubscription } from '../hooks/usePushSubscription'

interface Game {
  _id: string
  homeTeam: string
  awayTeam: string
  date: string
  stadium: string
  city: string
  competition: string
}

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

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function GameCard({ game, onRequestRide, onOfferRide }: { game: Game; onRequestRide: (game: Game) => void; onOfferRide: (game: Game) => void }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {game.homeTeam}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              נגד {game.awayTeam}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <CalendarMonthIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(game.date)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <LocationOnIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {game.stadium}, {game.city}
                </Typography>
              </Stack>
            </Stack>
          </Box>
          <Chip label={game.competition} size="small" color="primary" variant="outlined" />
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" fullWidth onClick={() => onRequestRide(game)}>
            צור בקשת נסיעה
          </Button>
          <Button variant="outlined" size="small" fullWidth onClick={() => onOfferRide(game)}>
            הצע נסיעה
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
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
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [editingProfile, setEditingProfile] = useState<ProfileSnapshot | null>(null)

  async function openProfileEdit() {
    setMenuAnchor(null)
    try {
      const res = await axios.get<ProfileSnapshot>('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEditingProfile(res.data)
    } catch {
      setToast('שגיאה בטעינת הפרופיל')
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
        setError('שגיאה בטעינת המשחקים')
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
          setToast('הבקשה שלך נשמרה!')
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
          setToast('ההצעה פורסמה בהצלחה!')
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
          setToast('הפרופיל עודכן בהצלחה')
        }}
        onCancel={() => setEditingProfile(null)}
      />
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #fff8ee 0%, #fff3d6 100%)',
        position: 'relative',
      }}
    >
      <AppBar position="sticky" component="header">
        <Toolbar dir="ltr">
          <SportsSoccerIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
            Find The Game
          </Typography>
          <Tooltip title="משחקים קרובים">
            <IconButton
              color="inherit"
              onClick={() => setView('main')}
              sx={{ opacity: view === 'main' ? 1 : 0.5 }}
            >
              <SportsSoccerIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="הפעילות שלי">
            <IconButton
              color="inherit"
              onClick={() => setView('activity')}
              sx={{ mr: 0.5, opacity: view === 'activity' ? 1 : 0.5 }}
            >
              <DirectionsCarIcon />
            </IconButton>
          </Tooltip>
          <NotificationsBell token={token} />
          <Tooltip title="חשבון">
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="small" sx={{ mr: 0.5 }}>
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: 'rgba(255,255,255,0.22)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  border: '2px solid rgba(255,255,255,0.55)',
                }}
              >
                {name.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={menuAnchor}
            open={!!menuAnchor}
            onClose={() => setMenuAnchor(null)}
            slotProps={{ paper: { sx: { minWidth: 180 } } }}
          >
            <MenuItem onClick={openProfileEdit}>
              <EditIcon fontSize="small" sx={{ mr: 1.5 }} />
              עריכת פרופיל
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null)
                onLogout()
              }}
            >
              <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
              יציאה
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {view === 'activity' ? (
        <Container maxWidth="sm" sx={{ py: 2 }}>
          <MyActivity token={token} />
        </Container>
      ) : (
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ef6c00 0%, #f9a825 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
            }}
          >
            משחקים קרובים
          </Typography>
          <Tooltip title="רענן רשימה">
            <span>
              <IconButton
                size="small"
                onClick={() => loadGames('refresh')}
                disabled={loading || refreshing}
                sx={{
                  color: 'primary.main',
                  bgcolor: 'rgba(239, 108, 0, 0.08)',
                  '&:hover': { bgcolor: 'rgba(239, 108, 0, 0.16)' },
                }}
              >
                <RefreshIcon
                  fontSize="small"
                  sx={{
                    animation: refreshing ? 'ftg-spin 0.8s linear infinite' : 'none',
                    '@keyframes ftg-spin': {
                      from: { transform: 'rotate(0deg)' },
                      to: { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          בחר משחק כדי למצוא או להציע נסיעה
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Stack spacing={2}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={140} />
              ))
            : games.map((game) => (
                <GameCard key={game._id} game={game} onRequestRide={setSelectedGame} onOfferRide={setOfferGame} />
              ))}

          {!loading && games.length === 0 && !error && (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              אין משחקים קרובים
            </Typography>
          )}
        </Stack>
      </Container>
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
