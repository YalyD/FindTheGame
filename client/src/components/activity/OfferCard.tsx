import {
  Avatar,
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
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import PhoneIcon from '@mui/icons-material/Phone'
import EditIcon from '@mui/icons-material/Edit'
import { useState } from 'react'
import { ACTIVITY } from '../../constants'
import { GameInfo } from '../game/GameInfo'
import { OFFER_STATUS } from './status'

interface Props {
  offer: PopulatedOffer
  onClose: (id: string) => Promise<void>
  onReopen: (id: string) => Promise<void>
  onCancel: (id: string) => Promise<void>
  onEdit: (offer: PopulatedOffer) => void
  onAcceptPassenger: (offerId: string, passengerId: string) => Promise<void>
  onRejectPassenger: (offerId: string, passengerId: string) => Promise<void>
}

export function OfferCard({
  offer,
  onClose,
  onReopen,
  onCancel,
  onEdit,
  onAcceptPassenger,
  onRejectPassenger,
}: Props) {
  const [closing, setClosing] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [actingOn, setActingOn] = useState<string | null>(null)
  const statusInfo = OFFER_STATUS[offer.status]
  const totalPeople = offer.passengers.reduce((sum, p) => sum + p.seatsNeeded, 0) + 1
  const hasRiders = offer.passengers.length > 0
  const fuelPerPerson = offer.fuelCost
    ? Math.round(offer.fuelCost.totalCost / totalPeople)
    : null

  async function handleClose() {
    setClosing(true)
    await onClose(offer._id)
    setClosing(false)
  }

  async function handleReopen() {
    setReopening(true)
    await onReopen(offer._id)
    setReopening(false)
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      await onCancel(offer._id)
    } finally {
      setCancelling(false)
    }
  }

  async function handleAccept(passengerId: string) {
    setActingOn(passengerId)
    try {
      await onAcceptPassenger(offer._id, passengerId)
    } finally {
      setActingOn(null)
    }
  }

  async function handleReject(passengerId: string) {
    setActingOn(passengerId)
    try {
      await onRejectPassenger(offer._id, passengerId)
    } finally {
      setActingOn(null)
    }
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

        {fuelPerPerson !== null && offer.fuelCost && (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 1.5 }}>
            <LocalGasStationIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {ACTIVITY.fuelTotal(offer.fuelCost.totalCost)} · {ACTIVITY.fuelPerPerson(fuelPerPerson)}
            </Typography>
          </Stack>
        )}

        {offer.pendingPassengers.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="warning.main" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
              {ACTIVITY.pendingPassengers}
            </Typography>
            <Stack spacing={1.5}>
              {offer.pendingPassengers.map((p) => (
                <Box key={p._id} sx={{ border: '1px solid', borderColor: 'warning.light', borderRadius: 1, p: 1.5 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
                    <Avatar src={p.picture} sx={{ width: 36, height: 36, fontSize: 14 }}>
                      {p.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {p.name}
                      </Typography>
                      {p.origin && (
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.3 }}>
                          <LocationOnIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {p.origin}
                          </Typography>
                        </Stack>
                      )}
                      {p.phone && (
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.3 }}>
                          <PhoneIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography
                            variant="caption"
                            component="a"
                            href={`tel:${p.phone}`}
                            sx={{ color: 'primary.main', textDecoration: 'none' }}
                          >
                            {p.phone}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title={offer.seatsAvailable === 0 ? ACTIVITY.noSeatsLeft : ''}>
                      <span style={{ flex: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          disabled={actingOn !== null || offer.seatsAvailable === 0}
                          onClick={() => handleAccept(p._id)}
                          fullWidth
                        >
                          {actingOn === p._id ? ACTIVITY.accepting : ACTIVITY.acceptPassenger}
                        </Button>
                      </span>
                    </Tooltip>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<CloseIcon />}
                      disabled={actingOn !== null}
                      onClick={() => handleReject(p._id)}
                      sx={{ flex: 1 }}
                    >
                      {actingOn === p._id ? ACTIVITY.rejecting : ACTIVITY.rejectPassenger}
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {offer.passengers.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="success.main" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
              {ACTIVITY.passengersJoined}
            </Typography>
            <Stack spacing={1.5}>
              {offer.passengers.map((p) => (
                <Box key={p._id} sx={{ border: '1px solid', borderColor: 'success.light', borderRadius: 1, p: 1.5 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Avatar src={p.picture} sx={{ width: 36, height: 36, fontSize: 14 }}>
                      {p.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {p.name}
                      </Typography>
                      {p.origin && (
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.3 }}>
                          <LocationOnIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {p.origin}
                          </Typography>
                        </Stack>
                      )}
                      {p.phone && (
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.3 }}>
                          <PhoneIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography
                            variant="caption"
                            component="a"
                            href={`tel:${p.phone}`}
                            sx={{ color: 'primary.main', textDecoration: 'none' }}
                          >
                            {p.phone}
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {offer.passengers.length === 0 && offer.pendingPassengers.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {ACTIVITY.noPassengers}
          </Typography>
        )}

        {offer.status !== 'cancelled' && (
          <Box sx={{ mt: 1.5 }}>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                color="primary"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => onEdit(offer)}
                fullWidth
              >
                {ACTIVITY.editOffer}
              </Button>
              {offer.status === 'closed' ? (
                <Button
                  size="small"
                  color="success"
                  variant="outlined"
                  onClick={handleReopen}
                  disabled={reopening}
                  fullWidth
                >
                  {reopening ? ACTIVITY.reopening : ACTIVITY.reopenOffer}
                </Button>
              ) : (
                <Button
                  size="small"
                  color="warning"
                  variant="outlined"
                  onClick={handleClose}
                  disabled={closing}
                  fullWidth
                >
                  {closing ? ACTIVITY.closing : ACTIVITY.closeOffer}
                </Button>
              )}
            </Stack>
            <Tooltip title={hasRiders ? ACTIVITY.cantCancelWithRiders : ''}>
              <span style={{ display: 'block' }}>
                <Button
                  size="small"
                  color="error"
                  variant="text"
                  onClick={handleCancel}
                  disabled={hasRiders || cancelling}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  {cancelling ? ACTIVITY.cancelling : ACTIVITY.cancelOffer}
                </Button>
              </span>
            </Tooltip>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
