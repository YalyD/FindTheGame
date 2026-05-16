self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'Find The Game'
  const body = data.body ?? ''

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/vite.svg',
      dir: 'rtl',
      lang: 'he',
    }),
  )

  // Tell any open clients to refresh their notifications
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      clients.forEach((c) => c.postMessage({ type: 'PUSH_RECEIVED' }))
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const focused = clients.find((c) => c.focused)
      if (focused) focused.focus()
      else if (clients.length > 0) clients[0].focus()
      else self.clients.openWindow('/')
    }),
  )
})
