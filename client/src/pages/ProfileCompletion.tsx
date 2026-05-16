import {
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import axios from 'axios'
import { useState } from 'react'
import { AddressFields } from '../components/AddressFields'

const ISRAELI_TEAMS = [
  'מכבי תל אביב',
  'הפועל תל אביב',
  'מכבי חיפה',
  'הפועל חיפה',
  'בית"ר ירושלים',
  'הפועל ירושלים',
  'הפועל באר שבע',
  'הפועל פתח תקווה',
  'בני סכנין',
  'עירוני קריית שמונה',
  'מ.ס. אשדוד',
  'מכבי בני ריינה',
  'מכבי נתניה',
  'עירוני טבריה',
]

const SEAT_OPTIONS = [2, 3, 4, 5, 6, 7]

interface Props {
  token: string
  onComplete: (newToken: string) => void
}

export function ProfileCompletion({ token, onComplete }: Props) {
  const [favoriteTeam, setFavoriteTeam] = useState('')
  const [address, setAddress] = useState('')
  const [carMake, setCarMake] = useState('')
  const [carModel, setCarModel] = useState('')
  const [carYear, setCarYear] = useState('')
  const [carSeats, setCarSeats] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const currentYear = new Date().getFullYear()
  const isValid =
    favoriteTeam &&
    address.trim() &&
    carMake.trim() &&
    carModel.trim() &&
    Number(carYear) >= 1990 &&
    Number(carYear) <= currentYear + 1 &&
    carSeats

  async function handleSubmit() {
    if (!isValid) return
    setLoading(true)
    setError(null)
    try {
      const res = await axios.patch<{ token: string }>(
        '/api/users/me',
        {
          favoriteTeam,
          address,
          car: {
            make: carMake,
            model: carModel,
            year: Number(carYear),
            seats: Number(carSeats),
          },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      onComplete(res.data.token)
    } catch {
      setError('שגיאה בשמירת הפרופיל, נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
          השלמת פרופיל
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          נדרש למלא פעם אחת לפני שניתן להשתמש באפליקציה
        </Typography>

        <Stack spacing={3}>
          <TextField
            select
            label="קבוצה אהובה"
            value={favoriteTeam}
            onChange={(e) => setFavoriteTeam(e.target.value)}
            fullWidth
            required
          >
            {ISRAELI_TEAMS.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>

          <AddressFields onChange={setAddress} />

          <Typography variant="subtitle2" color="text.secondary">
            פרטי רכב
          </Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              label="יצרן"
              value={carMake}
              onChange={(e) => setCarMake(e.target.value)}
              fullWidth
              required
              placeholder="טויוטה"
            />
            <TextField
              label="דגם"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              fullWidth
              required
              placeholder="קורולה"
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="שנת ייצור"
              value={carYear}
              onChange={(e) => setCarYear(e.target.value)}
              type="number"
              fullWidth
              required
              slotProps={{ htmlInput: { min: 1990, max: currentYear + 1 } }}
            />
            <TextField
              select
              label="מספר מושבים"
              value={carSeats}
              onChange={(e) => setCarSeats(e.target.value)}
              fullWidth
              required
            >
              {SEAT_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>
                  {n}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={!isValid || loading}
            >
              {loading ? 'שומר…' : 'שמור והמשך'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  )
}
