// Hebrew date formatting for game start times.

// Compact form for dense lists (e.g. "ב׳, 5.7, 19:00").
export function formatGameDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Spelled-out form for single-game detail screens.
export function formatGameDateLong(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}
