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
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import { useState } from 'react'
import axios from 'axios'
import { AddressFields } from '../components/address/AddressFields'
import { GameSummary } from '../components/game/GameSummary'
import { COMMON, CREATE_OFFER } from '../constants'
import type { Game } from '../types'

interface Props {
  game: Game
  token: string
  onSuccess: () => void
  onCancel: () => void
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
        setError(CREATE_OFFER.error)
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
            {CREATE_OFFER.heading}
          </Typography>
        </Stack>

        <GameSummary game={game} />

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {CREATE_OFFER.origin}
            </Typography>
            <AddressFields onChange={setOrigin} />
          </Box>

          <TextField
            select
            label={CREATE_OFFER.seatsAvailable}
            value={seatsAvailable}
            onChange={(e) => setSeatsAvailable(e.target.value)}
            fullWidth
            required
            helperText={CREATE_OFFER.seatsHelper}
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
              {COMMON.cancel}
            </Button>
            <Button variant="contained" onClick={handleSubmit} disabled={!isValid || loading}>
              {loading ? CREATE_OFFER.submitting : CREATE_OFFER.submit}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  )
}
