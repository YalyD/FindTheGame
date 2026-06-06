import { MenuItem, Stack, TextField, Typography } from '@mui/material'
import { PROFILE } from '../../constants'

const SEAT_OPTIONS = [2, 3, 4, 5, 6, 7]

interface Props {
  make: string
  model: string
  year: string
  seats: string
  onMakeChange: (value: string) => void
  onModelChange: (value: string) => void
  onYearChange: (value: string) => void
  onSeatsChange: (value: string) => void
}

// Car make / model / year / seats inputs used in the profile form.
export function CarDetailsFields({
  make,
  model,
  year,
  seats,
  onMakeChange,
  onModelChange,
  onYearChange,
  onSeatsChange,
}: Props) {
  const currentYear = new Date().getFullYear()

  return (
    <>
      <Typography variant="subtitle2" color="text.secondary">
        {PROFILE.carDetails}
      </Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          label={PROFILE.make}
          value={make}
          onChange={(e) => onMakeChange(e.target.value)}
          fullWidth
          required
          placeholder={PROFILE.makePlaceholder}
        />
        <TextField
          label={PROFILE.model}
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          fullWidth
          required
          placeholder={PROFILE.modelPlaceholder}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          label={PROFILE.year}
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          type="number"
          fullWidth
          required
          slotProps={{ htmlInput: { min: 1990, max: currentYear + 1 } }}
        />
        <TextField
          select
          label={PROFILE.seats}
          value={seats}
          onChange={(e) => onSeatsChange(e.target.value)}
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
    </>
  )
}
