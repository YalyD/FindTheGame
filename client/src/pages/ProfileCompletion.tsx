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
import { CAR_BRANDS, ISRAELI_TEAMS, PROFILE, COMMON } from '../constants'
import PhoneIcon from '@mui/icons-material/Phone'
import InputAdornment from '@mui/material/InputAdornment'
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
  const [phone, setPhone] = useState(initialProfile?.phone ?? '')
  const knownBrand = (b?: string) => (b && CAR_BRANDS.includes(b) ? b : '')
  const [carBrand, setCarBrand] = useState(knownBrand(initialProfile?.car?.brand))
  const [carModel, setCarModel] = useState(initialProfile?.car?.model ?? '')
  const [carYear, setCarYear] = useState(initialProfile?.car?.year?.toString() ?? '')
  const [carSeats, setCarSeats] = useState(initialProfile?.car?.seats?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!initialProfile) return
    setFavoriteTeam(initialProfile.favoriteTeam ?? '')
    setAddress(initialProfile.address ?? '')
    setPhone(initialProfile.phone ?? '')
    setCarBrand(knownBrand(initialProfile.car?.brand))
    setCarModel(initialProfile.car?.model ?? '')
    setCarYear(initialProfile.car?.year?.toString() ?? '')
    setCarSeats(initialProfile.car?.seats?.toString() ?? '')
  }, [initialProfile])

  const currentYear = new Date().getFullYear()
  const phoneValid = phone.trim() === '' || /^0(5\d|[2-489])[-\s]?\d{7}$/.test(phone.trim())
  const isValid =
    favoriteTeam &&
    address.trim() &&
    phoneValid &&
    carBrand.trim() &&
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
        phone: phone.trim() || undefined,
        car: {
          brand: carBrand,
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

          <TextField
            label={PROFILE.phone}
            placeholder={PROFILE.phonePlaceholder}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            error={!phoneValid}
            inputProps={{ dir: 'ltr' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            helperText={phoneValid ? PROFILE.phoneHelper : PROFILE.phoneInvalid}
          />

          <CarDetailsFields
            brand={carBrand}
            model={carModel}
            year={carYear}
            seats={carSeats}
            onBrandChange={setCarBrand}
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
