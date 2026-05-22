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

interface CreatedRequest {
  _id: string
  seatsNeeded: number
}

interface Props {
  game: Game
  token: string
  onSuccess: (req: CreatedRequest) => void
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

export function CreateRideRequest({ game, token, onSuccess, onCancel }: Props) {
  const [origin, setOrigin] = useState('')
  const [seatsNeeded, setSeatsNeeded] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isValid = origin.trim().length > 2 && Number(seatsNeeded) >= 1

  async function handleSubmit() {
    if (!isValid) return
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post<CreatedRequest>(
        '/api/ride-requests',
        { gameId: game._id, origin, seatsNeeded: Number(seatsNeeded) },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      onSuccess(res.data)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error)
      } else {
        setError('שגיאה ביצירת הבקשה, נסה שוב')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
          בקשת נסיעה
        </Typography>

        <Box sx={{ bgcolor: '#fff8e1', borderRadius: 2, p: 2, mb: 3, border: '1px solid #ffe082' }}>
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
          <AddressFields onChange={setOrigin} />

          <TextField
            select
            label="כמה מושבים דרושים?"
            value={seatsNeeded}
            onChange={(e) => setSeatsNeeded(e.target.value)}
            fullWidth
            required
          >
            {[1, 2, 3, 4].map((n) => (
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
              {loading ? 'שולח…' : 'שלח בקשה'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  )
}
