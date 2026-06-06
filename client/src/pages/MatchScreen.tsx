import { Alert, Button, Container, Divider, Stack, Typography } from '@mui/material'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { MATCH } from '../constants'
import { LoadingCards } from '../components/shared/LoadingCards'
import { OfferCard } from '../components/match/OfferCard'
import type { RideOffer } from '../components/match/types'

interface Props {
  gameId: string
  requestId: string
  seatsNeeded: number
  token: string
  onDone: () => void
}

export function MatchScreen({ gameId, requestId, seatsNeeded, token, onDone }: Props) {
  const [offers, setOffers] = useState<RideOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinedId, setJoinedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    axios
      .get<RideOffer[]>(`/api/ride-offers/game/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOffers(res.data))
      .catch(() => setError(MATCH.errorLoadOffers))
      .finally(() => setLoading(false))
  }, [gameId, token])

  async function handleJoin(offerId: string) {
    setJoiningId(offerId)
    setError(null)
    try {
      await axios.post(
        `/api/ride-offers/${offerId}/join`,
        { requestId },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setJoinedId(offerId)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError(MATCH.errorJoin)
      }
    } finally {
      setJoiningId(null)
    }
  }

  const bestOffer = offers.find((o) => o.seatsAvailable >= seatsNeeded)
  const otherOffers = offers.filter((o) => o._id !== bestOffer?._id)

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
        <DirectionsCarIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {MATCH.heading}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {MATCH.subtitle}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingCards count={2} height={130} />
      ) : offers.length === 0 ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
            {MATCH.activeTitle}
          </Typography>
          <Typography variant="body2">
            {MATCH.activeBody}
          </Typography>
        </Alert>
      ) : (
        <Stack spacing={2}>
          {bestOffer && (
            <>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
                {MATCH.recommended}
              </Typography>
              <OfferCard
                offer={bestOffer}
                isBest
                seatsNeeded={seatsNeeded}
                onJoin={handleJoin}
                joining={joiningId === bestOffer._id}
                joined={joinedId === bestOffer._id}
              />
            </>
          )}

          {otherOffers.length > 0 && (
            <>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {MATCH.allOffers}
                </Typography>
              </Divider>
              {otherOffers.map((offer) => (
                <OfferCard
                  key={offer._id}
                  offer={offer}
                  isBest={false}
                  seatsNeeded={seatsNeeded}
                  onJoin={handleJoin}
                  joining={joiningId === offer._id}
                  joined={joinedId === offer._id}
                />
              ))}
            </>
          )}
        </Stack>
      )}

      <Button
        variant={joinedId ? 'contained' : 'text'}
        fullWidth
        sx={{ mt: 3 }}
        onClick={onDone}
      >
        {MATCH.backToMain}
      </Button>
    </Container>
  )
}
