import { Avatar, Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation'
import { useState } from 'react'
import { ACTIVITY, COMMON } from '../../constants'
import { GameInfo } from '../game/GameInfo'
import { REQUEST_STATUS } from './status'

interface Props {
  req: PopulatedRequest
  onCancel: (id: string) => Promise<void>
  onViewOffers: (req: PopulatedRequest) => void
}

export function RequestCard({ req, onCancel, onViewOffers }: Props) {
  const [cancelling, setCancelling] = useState(false)
  const statusInfo = REQUEST_STATUS[req.status]
  const fuelCost = req.matchedOffer?.fuelCost
  const fuelShare = fuelCost
    ? Math.round((fuelCost.totalCost * req.seatsNeeded) / (req.matchedOffer!.seatsTaken + 1))
    : null

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

        {req.status === 'matched' && req.matchedOffer && (
          <Box sx={{ mt: 1.5, border: '1px solid', borderColor: 'success.light', borderRadius: 1, p: 1.5 }}>
            <Typography variant="caption" color="success.main" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
              {ACTIVITY.driverDetails}
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Avatar src={req.matchedOffer.driver.picture} sx={{ width: 40, height: 40 }}>
                {req.matchedOffer.driver.name.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {req.matchedOffer.driver.name}
                </Typography>
                {req.matchedOffer.driver.car && (
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.3 }}>
                    <DirectionsCarIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {req.matchedOffer.driver.car.brand} {req.matchedOffer.driver.car.model}
                    </Typography>
                  </Stack>
                )}
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.3 }}>
                  <LocationOnIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {req.matchedOffer.origin}
                  </Typography>
                </Stack>
                {req.matchedOffer.driver.phone ? (
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.3 }}>
                    <PhoneIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                    <Typography
                      variant="caption"
                      component="a"
                      href={`tel:${req.matchedOffer.driver.phone}`}
                      sx={{ color: 'primary.main', textDecoration: 'none' }}
                    >
                      {req.matchedOffer.driver.phone}
                    </Typography>
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, display: 'block' }}>
                    {ACTIVITY.driverPhoneMissing}
                  </Typography>
                )}
                {fuelShare !== null && fuelCost && (
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.3 }}>
                    <LocalGasStationIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {ACTIVITY.fuelYourShare(fuelShare)} · {ACTIVITY.fuelTotal(fuelCost.totalCost)}
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Stack>
          </Box>
        )}

        {req.status === 'open' && (
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            <Button size="small" variant="contained" onClick={() => onViewOffers(req)} fullWidth>
              {ACTIVITY.viewOffers}
            </Button>
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
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}
