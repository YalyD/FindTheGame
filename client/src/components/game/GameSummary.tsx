import { Box, Stack, Typography } from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { COMMON } from '../../constants'
import { formatGameDateLong } from '../../lib/date'

// Highlighted game summary shown at the top of the create-request / create-offer
// screens: matchup, kickoff time and venue.
export function GameSummary({ game }: { game: Game }) {
  return (
    <Box sx={{ bgcolor: '#fff8e1', borderRadius: 2, p: 2, mb: 3, border: '1px solid #ffe082' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
        <SportsSoccerIcon color="primary" fontSize="small" />
        <Typography sx={{ fontWeight: 700 }}>
          {game.homeTeam} {COMMON.versus} {game.awayTeam}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
        <CalendarMonthIcon color="action" fontSize="small" />
        <Typography variant="body2" color="text.secondary">
          {formatGameDateLong(game.date)}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <LocationOnIcon color="action" fontSize="small" />
        <Typography variant="body2" color="text.secondary">
          {game.stadium}, {game.city}
        </Typography>
      </Stack>
    </Box>
  )
}
