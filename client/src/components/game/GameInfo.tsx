import { Box, Stack, Typography } from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { ACTIVITY, COMMON } from '../../constants'
import { formatGameDateShort } from '../../lib/date'
import type { Game } from '../../types'

// Compact game header used inside activity cards. Tolerates a deleted game.
export function GameInfo({ game }: { game: Game | null }) {
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
            {formatGameDateShort(game.date)}
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
