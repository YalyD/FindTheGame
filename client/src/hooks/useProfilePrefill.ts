import { useEffect, useState } from 'react'
import { api } from '../apiHandler'

const ISRAELI_PHONE = /^0(5\d|[2-489])[-\s]?\d{7}$/

export function useProfilePrefill(token: string) {
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api.users
      .fetchProfile(token)
      .then((p) => {
        setPhone(p.phone ?? '')
        setAddress(p.address ?? '')
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [token])

  const phoneValid = ISRAELI_PHONE.test(phone.trim())

  return {
    phone,
    setPhone,
    phoneValid,
    address,
    loaded,
    savePhone: () => api.users.updatePhone(token, phone.trim()),
  }
}
