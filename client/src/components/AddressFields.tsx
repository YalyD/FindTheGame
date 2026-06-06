import { Autocomplete, Box, IconButton, Stack, TextField, Tooltip } from '@mui/material'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import { useEffect, useRef, useState } from 'react'
import { ADDRESS_FIELDS } from '../constants'

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
    house_number?: string
  }
}

interface Props {
  onChange: (value: string) => void
  initialValue?: string
}

// Parse "Street House, City" back into the three structured fields.
// Tolerant — returns whatever it can recover.
export function parseAddress(stored: string): { city: string; street: string; houseNumber: string } {
  const empty = { city: '', street: '', houseNumber: '' }
  if (!stored) return empty
  const parts = stored.split(',')
  if (parts.length < 2) return empty
  const city = parts.slice(1).join(',').trim()
  const streetAndHouse = parts[0].trim()
  // House number is the trailing whitespace-separated token if it looks numeric.
  const m = streetAndHouse.match(/^(.*?)\s+(\d+[\wא-ת]*)$/)
  if (m) return { city, street: m[1].trim(), houseNumber: m[2].trim() }
  return { city, street: streetAndHouse, houseNumber: '' }
}

export function AddressFields({ onChange, initialValue }: Props) {
  const initial = useRef(parseAddress(initialValue ?? '')).current
  const [city, setCity] = useState(initial.city)
  const [street, setStreet] = useState(initial.street)
  const [houseNumber, setHouseNumber] = useState(initial.houseNumber)

  const [cityInput, setCityInput] = useState(initial.city)
  const [cityOptions, setCityOptions] = useState<string[]>([])
  const [cityLoading, setCityLoading] = useState(false)

  const [streetInput, setStreetInput] = useState(initial.street)
  const [streetOptions, setStreetOptions] = useState<string[]>([])
  const [streetLoading, setStreetLoading] = useState(false)

  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const cityDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const streetDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // If the parent ever supplies a non-empty initialValue, propagate it once on mount.
  useEffect(() => {
    if (initial.city && initial.street && initial.houseNumber) {
      onChange(`${initial.street} ${initial.houseNumber}, ${initial.city}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  async function useCurrentLocation() {
    setGeoError(null)
    if (!('geolocation' in navigator)) {
      setGeoError(ADDRESS_FIELDS.geoUnsupported)
      return
    }
    setGeoLoading(true)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        })
      })
      const { latitude, longitude } = pos.coords
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
      const res = await fetch(url, { headers: { 'Accept-Language': 'he' } })
      if (!res.ok) throw new Error('reverse geocode failed')
      const data: NominatimResult = await res.json()
      const a = data.address
      const newCity =
        a?.city ?? a?.municipality ?? a?.town ?? a?.village ?? a?.hamlet ?? ''
      const newStreet = a?.road ?? ''
      const newHouse = a?.house_number ?? ''
      if (!newCity) {
        setGeoError(ADDRESS_FIELDS.geoNoAddress)
        return
      }
      setCity(newCity)
      setCityInput(newCity)
      setStreet(newStreet)
      setStreetInput(newStreet)
      setHouseNumber(newHouse)
      update(newCity, newStreet, newHouse)
    } catch (err: unknown) {
      const e = err as GeolocationPositionError
      if (e?.code === 1) setGeoError(ADDRESS_FIELDS.geoDenied)
      else if (e?.code === 3) setGeoError(ADDRESS_FIELDS.geoTimeout)
      else setGeoError(ADDRESS_FIELDS.geoError)
    } finally {
      setGeoLoading(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <Autocomplete
          sx={{ flexGrow: 1 }}
          options={cityOptions}
          loading={cityLoading}
          loadingText={ADDRESS_FIELDS.cityLoading}
          noOptionsText={cityInput.length < 2 ? ADDRESS_FIELDS.cityMinChars : ADDRESS_FIELDS.cityNoResults}
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
            <TextField
              {...params}
              label={ADDRESS_FIELDS.cityLabel}
              required
              error={!!geoError}
              helperText={geoError ?? undefined}
            />
          )}
        />
        <Tooltip title={ADDRESS_FIELDS.useMyLocation}>
          <span>
            <IconButton
              onClick={useCurrentLocation}
              disabled={geoLoading}
              aria-label={ADDRESS_FIELDS.useMyLocation}
              color="primary"
              sx={{ mt: 1, bgcolor: 'rgba(239, 108, 0, 0.08)', '&:hover': { bgcolor: 'rgba(239, 108, 0, 0.16)' } }}
            >
              <MyLocationIcon
                sx={{
                  animation: geoLoading ? 'ftg-spin 0.8s linear infinite' : 'none',
                  '@keyframes ftg-spin': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                  },
                }}
              />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Stack direction="row" spacing={2}>
        <Autocomplete
          sx={{ flexGrow: 1 }}
          options={streetOptions}
          loading={streetLoading}
          loadingText={ADDRESS_FIELDS.streetLoading}
          noOptionsText={!city ? ADDRESS_FIELDS.streetSelectCityFirst : streetInput.length < 2 ? ADDRESS_FIELDS.streetMinChars : ADDRESS_FIELDS.streetNoResults}
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
            <TextField {...params} label={ADDRESS_FIELDS.streetLabel} required />
          )}
        />

        <TextField
          label={ADDRESS_FIELDS.houseNumber}
          value={houseNumber}
          onChange={(e) => {
            setHouseNumber(e.target.value)
            update(city, street, e.target.value)
          }}
          required
          placeholder={ADDRESS_FIELDS.houseNumberPlaceholder}
          sx={{ width: 120 }}
        />
      </Stack>
      <Box sx={{ display: 'none' }}>{/* spacer */}</Box>
    </Stack>
  )
}
