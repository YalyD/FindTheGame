import { Autocomplete, Stack, TextField } from '@mui/material'
import { useEffect, useRef, useState } from 'react'

interface NominatimResult {
  place_id: number
  display_name: string
  address?: {
    city?: string
    town?: string
    village?: string
    hamlet?: string
    municipality?: string
    road?: string
  }
}

interface Props {
  onChange: (value: string) => void
}

export function AddressFields({ onChange }: Props) {
  const [city, setCity] = useState('')
  const [street, setStreet] = useState('')
  const [houseNumber, setHouseNumber] = useState('')

  const [cityInput, setCityInput] = useState('')
  const [cityOptions, setCityOptions] = useState<string[]>([])
  const [cityLoading, setCityLoading] = useState(false)

  const [streetInput, setStreetInput] = useState('')
  const [streetOptions, setStreetOptions] = useState<string[]>([])
  const [streetLoading, setStreetLoading] = useState(false)

  const cityDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const streetDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (cityInput.length < 2) {
      setCityOptions([])
      return
    }
    if (cityDebounce.current) clearTimeout(cityDebounce.current)
    cityDebounce.current = setTimeout(async () => {
      setCityLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput)}&format=json&countrycodes=il&limit=10&addressdetails=1`
        const res = await fetch(url, { headers: { 'Accept-Language': 'he' } })
        const data: NominatimResult[] = await res.json()
        const cities = data
          .map((r) =>
            r.address?.city ??
            r.address?.municipality ??
            r.address?.town ??
            r.address?.village ??
            r.address?.hamlet,
          )
          .filter((name): name is string => !!name)
        setCityOptions([...new Set(cities)])
      } catch {
        setCityOptions([])
      } finally {
        setCityLoading(false)
      }
    }, 400)
  }, [cityInput])

  useEffect(() => {
    if (!city || streetInput.length < 2) {
      setStreetOptions([])
      return
    }
    if (streetDebounce.current) clearTimeout(streetDebounce.current)
    streetDebounce.current = setTimeout(async () => {
      setStreetLoading(true)
      try {
        const q = encodeURIComponent(`${streetInput}, ${city}`)
        const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&countrycodes=il&limit=10&addressdetails=1`
        const res = await fetch(url, { headers: { 'Accept-Language': 'he' } })
        const data: NominatimResult[] = await res.json()
        const streets = data
          .map((r) => r.address?.road)
          .filter((r): r is string => !!r && r.length > 0)
        setStreetOptions([...new Set(streets)])
      } catch {
        setStreetOptions([])
      } finally {
        setStreetLoading(false)
      }
    }, 400)
  }, [streetInput, city])

  function update(newCity: string, newStreet: string, newHouse: string) {
    if (newCity && newStreet.trim() && newHouse.trim()) {
      onChange(`${newStreet.trim()} ${newHouse.trim()}, ${newCity}`)
    } else {
      onChange('')
    }
  }

  return (
    <Stack spacing={2}>
      <Autocomplete
        options={cityOptions}
        loading={cityLoading}
        loadingText="מחפש ישובים..."
        noOptionsText={cityInput.length < 2 ? 'הקלד לפחות 2 תווים' : 'לא נמצאו ישובים'}
        value={city || null}
        inputValue={cityInput}
        onInputChange={(_e, val, reason) => {
          setCityInput(val)
          if (reason === 'clear') {
            setCity('')
            setStreet('')
            setStreetInput('')
            update('', '', houseNumber)
          }
        }}
        onChange={(_e, val) => {
          const selected = val ?? ''
          setCity(selected)
          setStreet('')
          setStreetInput('')
          update(selected, '', houseNumber)
        }}
        filterOptions={(x) => x}
        renderInput={(params) => (
          <TextField {...params} label="עיר / ישוב" required />
        )}
      />

      <Stack direction="row" spacing={2}>
        <Autocomplete
          sx={{ flexGrow: 1 }}
          options={streetOptions}
          loading={streetLoading}
          loadingText="מחפש רחובות..."
          noOptionsText={!city ? 'בחר עיר תחילה' : streetInput.length < 2 ? 'הקלד לפחות 2 תווים' : 'לא נמצאו רחובות'}
          disabled={!city}
          value={street || null}
          inputValue={streetInput}
          onInputChange={(_e, val, reason) => {
            setStreetInput(val)
            if (reason === 'clear') {
              setStreet('')
              update(city, '', houseNumber)
            }
          }}
          onChange={(_e, val) => {
            const selected = val ?? ''
            setStreet(selected)
            update(city, selected, houseNumber)
          }}
          filterOptions={(x) => x}
          renderInput={(params) => (
            <TextField {...params} label="רחוב" required />
          )}
        />

        <TextField
          label='מס" בית'
          value={houseNumber}
          onChange={(e) => {
            setHouseNumber(e.target.value)
            update(city, street, e.target.value)
          }}
          required
          placeholder="5"
          sx={{ width: 120 }}
        />
      </Stack>
    </Stack>
  )
}
