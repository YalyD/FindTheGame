import { Avatar, Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import StarIcon from '@mui/icons-material/Star'
import { COMMON, MATCH } from '../../constants'

interface Props {
  offer: RideOffer
  isBest: boolean
  seatsNeeded: number
  onJoin: (offerId: string) => void
  joining: boolean
  joined: boolean
}

// A driver's ride offer on the match screen, with a join action.
export function OfferCard({ offer, isBest, seatsNeeded, onJoin, joining, joined }: Props) {
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
            label={COMMON.seats(offer.seatsAvailable)}
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
              {MATCH.joined}
            </Typography>
          </Stack>
        ) : (
          <Button
            variant={isBest ? 'contained' : 'outlined'}
            fullWidth
            disabled={!hasEnough || joining}
            onClick={() => onJoin(offer._id)}
          >
            {joining ? MATCH.joining : hasEnough ? MATCH.join : MATCH.notEnoughSeats}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
