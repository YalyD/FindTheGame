import { Autocomplete, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { CAR_BRANDS, PROFILE } from '../../constants'

const SEAT_OPTIONS = [2, 3, 4, 5, 6, 7]

interface Props {
  brand: string
  model: string
  year: string
  seats: string
  onBrandChange: (value: string) => void
  onModelChange: (value: string) => void
  onYearChange: (value: string) => void
  onSeatsChange: (value: string) => void
}

export function CarDetailsFields({
  brand,
  model,
  year,
  seats,
  onBrandChange,
  onModelChange,
  onYearChange,
  onSeatsChange,
}: Props) {
  const currentYear = new Date().getFullYear()
  const brandValue = brand && CAR_BRANDS.includes(brand) ? brand : null

  return (
    <>
      <Typography variant="subtitle2" color="text.secondary">
        {PROFILE.carDetails}
      </Typography>

      <Stack direction="row" spacing={2}>
        <Autocomplete
          fullWidth
          options={CAR_BRANDS}
          value={brandValue}
          onChange={(_e, val) => onBrandChange(val ?? '')}
          noOptionsText={PROFILE.brandNoResults}
          renderInput={(params) => (
            <TextField
              {...params}
              label={PROFILE.brand}
              required
              placeholder={PROFILE.brandPlaceholder}
              helperText={PROFILE.brandHelper}
            />
          )}
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
