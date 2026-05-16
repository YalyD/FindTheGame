import {
  Box,
  Button,
  Container,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import { useState } from 'react'
import axios from 'axios'
import { AddressFields } from '../components/AddressFields'

interface Game {
  _id: string
  homeTeam: string
  awayTeam: string
  date: string
  stadium: string
  city: string
}

interface Props {
  game: Game
  token: string
  onSuccess: () => void
  onCancel: () => void
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CreateRideOffer({ game, token, onSuccess, onCancel }: Props) {
  const [origin, setOrigin] = useState('')
  const [seatsAvailable, setSeatsAvailable] = useState('2')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isValid = origin.trim().length > 2 && Number(seatsAvailable) >= 1

  async function handleSubmit() {
    if (!isValid) return
    setLoading(true)
    setError(null)
    try {
      await axios.post(
        '/api/ride-offers',
        { gameId: game._id, origin, seatsAvailable: Number(seatsAvailable) },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      onSuccess()
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError('שגיאה ביצירת ההצעה, נסה שוב')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
          <DirectionsCarIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            הצעת נסיעה
          </Typography>
        </Stack>

        <Box sx={{ bgcolor: '#e8f0fe', borderRadius: 2, p: 2, mb: 3, border: '1px solid #90caf9' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
            <SportsSoccerIcon color="primary" fontSize="small" />
            <Typography sx={{ fontWeight: 700 }}>
              {game.homeTeam} נגד {game.awayTeam}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
            <CalendarMonthIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              {formatDate(game.date)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <LocationOnIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              {game.stadium}, {game.city}
            </Typography>
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              נקודת מוצא
            </Typography>
            <AddressFields onChange={setOrigin} />
          </Box>

          <TextField
            select
            label="כמה מושבים פנויים?"
            value={seatsAvailable}
            onChange={(e) => setSeatsAvailable(e.target.value)}
            fullWidth
            required
            helperText="לא כולל את המושב שלך"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </TextField>

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onCancel} disabled={loading}>
              ביטול
            </Button>
            <Button variant="contained" onClick={handleSubmit} disabled={!isValid || loading}>
              {loading ? 'שולח…' : 'פרסם הצעה'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  )
}
