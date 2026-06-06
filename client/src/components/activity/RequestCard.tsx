import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { useState } from 'react'
import { ACTIVITY, COMMON } from '../../constants'
import { GameInfo } from '../game/GameInfo'
import { REQUEST_STATUS } from './status'
import type { PopulatedRequest } from './types'

interface Props {
  req: PopulatedRequest
  onCancel: (id: string) => Promise<void>
}

// A ride request the user created, with status and a cancel action.
export function RequestCard({ req, onCancel }: Props) {
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
