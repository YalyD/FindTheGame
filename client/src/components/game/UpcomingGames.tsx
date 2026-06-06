import { Container, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { MAIN } from '../../constants'
import { GameCard } from './GameCard'
import { LoadingCards } from '../shared/LoadingCards'
import type { Game } from '../../types'

interface Props {
  games: Game[]
  loading: boolean
  refreshing: boolean
  error: string | null
  onRefresh: () => void
  onRequestRide: (game: Game) => void
  onOfferRide: (game: Game) => void
}

// The upcoming-games list with its header, refresh control and empty/loading states.
export function UpcomingGames({
  games,
  loading,
  refreshing,
  error,
  onRefresh,
  onRequestRide,
  onOfferRide,
}: Props) {
  return (
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
          {MAIN.upcomingGames}
        </Typography>
        <Tooltip title={MAIN.refreshList}>
          <span>
            <IconButton
              size="small"
              onClick={onRefresh}
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
        {MAIN.pickGame}
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Stack spacing={2}>
        {loading ? (
          <LoadingCards count={3} height={140} />
        ) : (
          games.map((game) => (
            <GameCard
              key={game._id}
              game={game}
              onRequestRide={onRequestRide}
              onOfferRide={onOfferRide}
            />
          ))
        )}

        {!loading && games.length === 0 && !error && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {MAIN.noGames}
          </Typography>
        )}
      </Stack>
    </Container>
  )
}
