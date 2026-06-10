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
import { useEffect, useState } from 'react'
import { AddressFields } from '../components/address/AddressFields'
import { CarDetailsFields } from '../components/profile/CarDetailsFields'
import { ISRAELI_TEAMS, PROFILE, COMMON } from '../constants'
import { api } from '../apiHandler'

interface Props {
  token: string
  onComplete: (newToken: string) => void
  mode?: 'create' | 'edit'
  initialProfile?: ProfileSnapshot | null
  onCancel?: () => void
}

export function ProfileCompletion({
  token,
  onComplete,
  mode = 'create',
  initialProfile,
  onCancel,
}: Props) {
  const [favoriteTeam, setFavoriteTeam] = useState(initialProfile?.favoriteTeam ?? '')
  const [address, setAddress] = useState(initialProfile?.address ?? '')
  const [carMake, setCarMake] = useState(initialProfile?.car?.make ?? '')
  const [carModel, setCarModel] = useState(initialProfile?.car?.model ?? '')
  const [carYear, setCarYear] = useState(initialProfile?.car?.year?.toString() ?? '')
  const [carSeats, setCarSeats] = useState(initialProfile?.car?.seats?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Re-sync if initialProfile arrives after mount (parent fetches it async).
  useEffect(() => {
    if (!initialProfile) return
    setFavoriteTeam(initialProfile.favoriteTeam ?? '')
    setAddress(initialProfile.address ?? '')
    setCarMake(initialProfile.car?.make ?? '')
    setCarModel(initialProfile.car?.model ?? '')
    setCarYear(initialProfile.car?.year?.toString() ?? '')
    setCarSeats(initialProfile.car?.seats?.toString() ?? '')
  }, [initialProfile])

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
      const newToken = await api.users.updateProfile(token, {
        favoriteTeam,
        address,
        car: {
          make: carMake,
          model: carModel,
          year: Number(carYear),
          seats: Number(carSeats),
        },
      })
      onComplete(newToken)
    } catch {
      setError(PROFILE.error)
    } finally {
      setLoading(false)
    }
  }

  const isEdit = mode === 'edit'

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
          {isEdit ? PROFILE.headingEdit : PROFILE.headingCreate}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {isEdit ? PROFILE.subtitleEdit : PROFILE.subtitleCreate}
        </Typography>

        <Stack spacing={3}>
          <TextField
            select
            label={PROFILE.favoriteTeam}
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

          <AddressFields onChange={setAddress} initialValue={initialProfile?.address} />

          <CarDetailsFields
            make={carMake}
            model={carModel}
            year={carYear}
            seats={carSeats}
            onMakeChange={setCarMake}
            onModelChange={setCarModel}
            onYearChange={setCarYear}
            onSeatsChange={setCarSeats}
          />

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {isEdit && onCancel && (
              <Button variant="outlined" onClick={onCancel} disabled={loading}>
                {COMMON.cancel}
              </Button>
            )}
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={!isValid || loading}
            >
              {loading ? PROFILE.saving : isEdit ? PROFILE.saveChanges : PROFILE.saveContinue}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  )
}
