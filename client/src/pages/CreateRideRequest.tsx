import {
  Button,
  Container,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import axios from 'axios'
import { AddressFields } from '../components/address/AddressFields'
import { GameSummary } from '../components/game/GameSummary'
import { COMMON, CREATE_REQUEST } from '../constants'
import type { Game } from '../types'

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
        setError(CREATE_REQUEST.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
          {CREATE_REQUEST.heading}
        </Typography>

        <GameSummary game={game} />

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={3}>
          <AddressFields onChange={setOrigin} />

          <TextField
            select
            label={CREATE_REQUEST.seatsNeeded}
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
              {COMMON.cancel}
            </Button>
            <Button variant="contained" onClick={handleSubmit} disabled={!isValid || loading}>
              {loading ? CREATE_REQUEST.submitting : CREATE_REQUEST.submit}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  )
}
