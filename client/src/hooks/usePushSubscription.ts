import { useEffect } from 'react'
import axios from 'axios'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function usePushSubscription(token: string) {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    async function subscribe() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')

        const { data } = await axios.get<{ key: string }>('/api/push/vapid-public-key')
        const applicationServerKey = urlBase64ToUint8Array(data.key)

        const existing = await reg.pushManager.getSubscription()
        const sub =
          existing ??
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey as BufferSource,
          }))

        await axios.post('/api/push/subscribe', sub.toJSON(), {
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (err) {
        console.warn('Push subscription failed:', err)
      }
    }

    subscribe()
  }, [token])
}
