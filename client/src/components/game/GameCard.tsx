import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { COMMON, MAIN } from '../../constants'
import { formatGameDateShort } from '../../lib/date'

interface Props {
  game: Game
  onRequestRide: (game: Game) => void
  onOfferRide: (game: Game) => void
}

// One upcoming game in the Main list, with request/offer actions.
export function GameCard({ game, onRequestRide, onOfferRide }: Props) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {game.homeTeam}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {COMMON.versus} {game.awayTeam}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <CalendarMonthIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {formatGameDateShort(game.date)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <LocationOnIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {game.stadium}, {game.city}
                </Typography>
              </Stack>
            </Stack>
          </Box>
          <Chip label={game.competition} size="small" color="primary" variant="outlined" />
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" fullWidth onClick={() => onRequestRide(game)}>
            {MAIN.requestRide}
          </Button>
          <Button variant="outlined" size="small" fullWidth onClick={() => onOfferRide(game)}>
            {MAIN.offerRide}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
