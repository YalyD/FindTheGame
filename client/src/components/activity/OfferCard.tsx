import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import { useState } from 'react'
import { ACTIVITY } from '../../constants'
import { GameInfo } from '../game/GameInfo'
import { OFFER_STATUS } from './status'

interface Props {
  offer: PopulatedOffer
  onCancel: (id: string) => Promise<void>
}

// A ride offer the user published, with joined passengers and a cancel action.
export function OfferCard({ offer, onCancel }: Props) {
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
