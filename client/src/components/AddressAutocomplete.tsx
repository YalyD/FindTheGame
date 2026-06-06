import { Autocomplete, TextField } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { ADDRESS_AUTOCOMPLETE } from '../constants'

interface NominatimResult {
  place_id: number
  display_name: string
}

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helperText?: string
  required?: boolean
}

export function AddressAutocomplete({ label, value, onChange, placeholder, helperText, required }: Props) {
  const [inputValue, setInputValue] = useState(value)
  const [options, setOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (inputValue.length < 3) {
      setOptions([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(inputValue)}&format=json&countrycodes=il&limit=6&addressdetails=0`
        const res = await fetch(url, { headers: { 'Accept-Language': 'he' } })
        const data: NominatimResult[] = await res.json()
        setOptions(data.map((r) => r.display_name))
      } catch {
        setOptions([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }, [inputValue])

  return (
    <Autocomplete
      options={options}
      loading={loading}
      loadingText={ADDRESS_AUTOCOMPLETE.loading}
      noOptionsText={inputValue.length < 3 ? ADDRESS_AUTOCOMPLETE.minChars : ADDRESS_AUTOCOMPLETE.noResults}
      value={value || null}
      inputValue={inputValue}
      onInputChange={(_e, val, reason) => {
        setInputValue(val)
        if (reason === 'clear') onChange('')
      }}
      onChange={(_e, val) => {
        onChange(val ?? '')
      }}
      filterOptions={(x) => x}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          required={required}
          error={required && value === '' && inputValue.length > 0}
        />
      )}
    />
  )
}
