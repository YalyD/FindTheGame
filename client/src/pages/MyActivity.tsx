import {
  Alert,
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { ACTIVITY, COMMON } from '../constants'

interface Game {
  _id: string
  homeTeam: string
  awayTeam: string
  date: string
  stadium: string
  city: string
}

interface PopulatedRequest {
  _id: string
  game: Game
  origin: string
  seatsNeeded: number
  status: 'open' | 'matched' | 'cancelled'
}

interface Passenger {
  _id: string
  name: string
  picture: string
}

interface PopulatedOffer {
  _id: string
  game: Game
  origin: string
  seatsAvailable: number
  passengers: Passenger[]
  status: 'open' | 'full' | 'cancelled'
}

interface Props {
  token: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const REQUEST_STATUS: Record<PopulatedRequest['status'], { label: string; color: 'info' | 'success' | 'default' }> = {
  open: { label: ACTIVITY.requestStatus.open, color: 'info' },
  matched: { label: ACTIVITY.requestStatus.matched, color: 'success' },
  cancelled: { label: ACTIVITY.requestStatus.cancelled, color: 'default' },
}

const OFFER_STATUS: Record<PopulatedOffer['status'], { label: string; color: 'info' | 'warning' | 'default' }> = {
  open: { label: ACTIVITY.offerStatus.open, color: 'info' },
  full: { label: ACTIVITY.offerStatus.full, color: 'warning' },
  cancelled: { label: ACTIVITY.offerStatus.cancelled, color: 'default' },
}

function GameInfo({ game }: { game: Game | null }) {
  if (!game) {
    return (
      <Typography variant="body2" color="text.disabled">
        {ACTIVITY.gameDeleted}
      </Typography>
    )
  }
  return (
    <Box>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mb: 0.5 }}>
        <SportsSoccerIcon fontSize="small" color="primary" />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {game.homeTeam} {COMMON.versus} {game.awayTeam}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <CalendarMonthIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            {formatDate(game.date)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <LocationOnIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            {game.stadium}, {game.city}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  )
}

function RequestCard({
  req,
  onCancel,
}: {
  req: PopulatedRequest
  onCancel: (id: string) => Promise<void>
}) {
  const [cancelling, setCancelling] = useState(false)
  const statusInfo = REQUEST_STATUS[req.status]

  async function handleCancel() {
    setCancelling(true)
    await onCancel(req._id)
    setCancelling(false)
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <GameInfo game={req.game} />
          <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
        </Stack>
        <Divider sx={{ mb: 1.5 }} />
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <LocationOnIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {req.origin}
            </Typography>
          </Stack>
          <Chip label={COMMON.seats(req.seatsNeeded)} size="small" variant="outlined" />
        </Stack>

        {req.status === 'open' && (
          <Box sx={{ mt: 1.5 }}>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={handleCancel}
              disabled={cancelling}
              fullWidth
            >
              {cancelling ? ACTIVITY.cancelling : ACTIVITY.cancelRequest}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

function OfferCard({
  offer,
  onCancel,
}: {
  offer: PopulatedOffer
  onCancel: (id: string) => Promise<void>
}) {
  const [cancelling, setCancelling] = useState(false)
  const statusInfo = OFFER_STATUS[offer.status]

  async function handleCancel() {
    setCancelling(true)
    await onCancel(offer._id)
    setCancelling(false)
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <GameInfo game={offer.game} />
          <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
        </Stack>
        <Divider sx={{ mb: 1.5 }} />
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <LocationOnIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {offer.origin}
            </Typography>
          </Stack>
          <Chip
            icon={<DirectionsCarIcon />}
            label={ACTIVITY.seatsAvailable(offer.seatsAvailable)}
            size="small"
            variant="outlined"
            color={offer.seatsAvailable > 0 ? 'success' : 'warning'}
          />
        </Stack>

        {offer.passengers.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              {ACTIVITY.passengersJoined}
            </Typography>
            <AvatarGroup max={5} sx={{ justifyContent: 'flex-start' }}>
              {offer.passengers.map((p) => (
                <Tooltip key={p._id} title={p.name}>
                  <Avatar src={p.picture} sx={{ width: 28, height: 28, fontSize: 12 }}>
                    {p.name.charAt(0)}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          </Box>
        )}

        {offer.passengers.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {ACTIVITY.noPassengers}
          </Typography>
        )}

        {offer.status === 'open' && (
          <Box sx={{ mt: 1.5 }}>
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={handleCancel}
              disabled={cancelling}
              fullWidth
            >
              {cancelling ? ACTIVITY.cancelling : ACTIVITY.cancelOffer}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingCards() {
  return (
    <Stack spacing={2}>
      {[1, 2].map((i) => (
        <Skeleton key={i} variant="rounded" height={150} />
      ))}
    </Stack>
  )
}

export function MyActivity({ token }: Props) {
  const [tab, setTab] = useState(0)
  const [requests, setRequests] = useState<PopulatedRequest[]>([])
  const [offers, setOffers] = useState<PopulatedOffer[]>([])
  const [loadingReq, setLoadingReq] = useState(true)
  const [loadingOff, setLoadingOff] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    axios
      .get<PopulatedRequest[]>('/api/ride-requests/mine', { headers })
      .then((res) => setRequests(res.data))
      .catch(() => setError(ACTIVITY.errorLoadRequests))
      .finally(() => setLoadingReq(false))

    axios
      .get<PopulatedOffer[]>('/api/ride-offers/mine', { headers })
      .then((res) => setOffers(res.data))
      .catch(() => setError(ACTIVITY.errorLoadOffers))
      .finally(() => setLoadingOff(false))
  }, [token])

  async function cancelRequest(id: string) {
    await axios.patch(`/api/ride-requests/${id}/cancel`, {}, { headers })
    setRequests((prev) => prev.filter((r) => r._id !== id))
  }

  async function cancelOffer(id: string) {
    await axios.patch(`/api/ride-offers/${id}/cancel`, {}, { headers })
    setOffers((prev) => prev.filter((o) => o._id !== id))
  }

  return (
    <Box>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="fullWidth">
        <Tab label={ACTIVITY.myRequestsTab(requests.length)} />
        <Tab label={ACTIVITY.myOffersTab(offers.length)} />
      </Tabs>

      <Box sx={{ p: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {tab === 0 && (
          <>
            {loadingReq ? (
              <LoadingCards />
            ) : requests.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                {ACTIVITY.noRequests}
              </Typography>
            ) : (
              <Stack spacing={2}>
                {requests.map((req) => (
                  <RequestCard key={req._id} req={req} onCancel={cancelRequest} />
                ))}
              </Stack>
            )}
          </>
        )}

        {tab === 1 && (
          <>
            {loadingOff ? (
              <LoadingCards />
            ) : offers.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                {ACTIVITY.noOffers}
              </Typography>
            ) : (
              <Stack spacing={2}>
                {offers.map((offer) => (
                  <OfferCard key={offer._id} offer={offer} onCancel={cancelOffer} />
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}
