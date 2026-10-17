import { Box, Container, Snackbar } from '@mui/material'
import { AppHeader } from '../components/layout/AppHeader'
import { UpcomingGames } from '../components/game/UpcomingGames'
import { MyActivity } from './MyActivity'

interface Props {
  token: string
  name: string
  view: 'main' | 'activity'
  onSelectView: (view: 'main' | 'activity') => void
  onEditProfile: () => void
  onLogout: () => void
  games: Game[]
  loading: boolean
  refreshing: boolean
  error: string | null
  onRefresh: () => void
  onRequestRide: (game: Game) => void
  onOfferRide: (game: Game) => void
  onViewOffers: (req: PopulatedRequest) => void
  openRequestGameIds: Set<string>
  openOfferGameIds: Set<string>
  toast: string | null
  onToastClose: () => void
}

export function HomeScreen({
  token,
  name,
  view,
  onSelectView,
  onEditProfile,
  onLogout,
  games,
  loading,
  refreshing,
  error,
  onRefresh,
  onRequestRide,
  onOfferRide,
  onViewOffers,
  openRequestGameIds,
  openOfferGameIds,
  toast,
  onToastClose,
}: Props) {
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
        onSelectView={onSelectView}
        onEditProfile={onEditProfile}
        onLogout={onLogout}
      />

      {view === 'activity' ? (
        <Container maxWidth="sm" sx={{ py: 2 }}>
          <MyActivity token={token} onViewOffers={onViewOffers} />
        </Container>
      ) : (
        <UpcomingGames
          games={games}
          loading={loading}
          refreshing={refreshing}
          error={error}
          onRefresh={onRefresh}
          onRequestRide={onRequestRide}
          onOfferRide={onOfferRide}
          openRequestGameIds={openRequestGameIds}
          openOfferGameIds={openOfferGameIds}
        />
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={onToastClose}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
