import { InputAdornment, TextField } from '@mui/material'
import PhoneIcon from '@mui/icons-material/Phone'
import { PROFILE } from '../../constants'

interface Props {
  value: string
  valid: boolean
  onChange: (value: string) => void
}

export function PhoneField({ value, valid, onChange }: Props) {
  const showError = value.trim() !== '' && !valid
  return (
    <TextField
      label={PROFILE.phone}
      placeholder={PROFILE.phonePlaceholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      required
      error={showError}
      inputProps={{ dir: 'ltr' }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <PhoneIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
      helperText={showError ? PROFILE.phoneInvalid : PROFILE.phoneRideHelper}
    />
  )
}
