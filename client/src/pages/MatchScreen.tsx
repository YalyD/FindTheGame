import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import StarIcon from '@mui/icons-material/Star'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface Driver {
  _id: string
  name: string
  picture: string
}

interface Offer {
  _id: string
  driver: Driver
  origin: string
  seatsAvailable: number
}

interface Props {
  gameId: string
  requestId: string
  seatsNeeded: number
  token: string
  onDone: () => void
}

function OfferCard({
  offer,
  isBest,
  seatsNeeded,
  onJoin,
  joining,
  joined,
}: {
  offer: Offer
  isBest: boolean
  seatsNeeded: number
  onJoin: (offerId: string) => void
  joining: boolean
  joined: boolean
}) {
  const hasEnough = offer.seatsAvailable >= seatsNeeded

  return (
    <Card
      sx={
        isBest
          ? {
              border: '2px solid',
              borderColor: 'primary.main',
              boxShadow: '0 10px 24px -10px rgba(239, 108, 0, 0.3)',
            }
          : undefined
      }
    >
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
          {isBest && <StarIcon color="primary" fontSize="small" />}
          <Avatar src={offer.driver.picture} sx={{ width: 32, height: 32 }}>
            {offer.driver.name.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>{offer.driver.name}</Typography>
          </Box>
          <Chip
            label={`${offer.seatsAvailable} מושבים`}
            size="small"
            color={hasEnough ? 'success' : 'warning'}
            variant="outlined"
          />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
          <LocationOnIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {offer.origin}
          </Typography>
        </Stack>

        {joined ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <CheckCircleIcon color="success" fontSize="small" />
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
              הצטרפת להצעה זו!
            </Typography>
          </Stack>
        ) : (
          <Button
            variant={isBest ? 'contained' : 'outlined'}
            fullWidth
            disabled={!hasEnough || joining}
            onClick={() => onJoin(offer._id)}
          >
            {joining ? 'מצטרף…' : hasEnough ? 'הצטרף להצעה' : 'אין מספיק מושבים'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function MatchScreen({ gameId, requestId, seatsNeeded, token, onDone }: Props) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinedId, setJoinedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    axios
      .get<Offer[]>(`/api/ride-offers/game/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOffers(res.data))
      .catch(() => setError('שגיאה בטעינת ההצעות'))
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
        setError('שגיאה בהצטרפות להצעה')
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
          הצעות נסיעה
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        הבקשה שלך נשמרה ✓ — בחר הצעת נסיעה מתאימה למטה
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Stack spacing={2}>
          {[1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={130} />
          ))}
        </Stack>
      ) : offers.length === 0 ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
            הבקשה שלך פעילה
          </Typography>
          <Typography variant="body2">
            עדיין אין הצעות נסיעה למשחק הזה. נשלח לך התראה ברגע שנהג יפרסם הצעה — אפשר לסגור את המסך בשקט.
          </Typography>
        </Alert>
      ) : (
        <Stack spacing={2}>
          {bestOffer && (
            <>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
                ההצעה המומלצת עבורך
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
                  כל ההצעות הזמינות
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
        חזור למסך הראשי
      </Button>
    </Container>
  )
}
