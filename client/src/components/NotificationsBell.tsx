import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface INotification {
  _id: string
  message: string
  read: boolean
  createdAt: string
}

interface Props {
  token: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'עכשיו'
  if (mins < 60) return `לפני ${mins} דקות`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `לפני ${hours} שעות`
  return `לפני ${Math.floor(hours / 24)} ימים`
}

export function NotificationsBell({ token }: Props) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)
  const queryClient = useQueryClient()
  const headers = { Authorization: `Bearer ${token}` }

  const { data: notifications = [] } = useQuery<INotification[]>({
    queryKey: ['notifications'],
    queryFn: () =>
      axios.get<INotification[]>('/api/notifications', { headers }).then((r) => r.data),
    refetchOnWindowFocus: true,
  })

  // Refresh badge when a push arrives (service worker posts PUSH_RECEIVED)
  useEffect(() => {
    function onSwMessage(event: MessageEvent) {
      if (event.data?.type === 'PUSH_RECEIVED') {
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
      }
    }
    navigator.serviceWorker?.addEventListener('message', onSwMessage)
    return () => navigator.serviceWorker?.removeEventListener('message', onSwMessage)
  }, [queryClient])

  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleOpen(e: React.MouseEvent<HTMLButtonElement>) {
    setAnchor(e.currentTarget)
    if (unreadCount > 0) {
      await axios.patch('/api/notifications/read-all', {}, { headers })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  }

  return (
    <>
      <Tooltip title="התראות">
        <IconButton color="inherit" onClick={handleOpen} sx={{ mr: 0.5 }}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ width: 320 }}>
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              התראות
            </Typography>
            {notifications.length > 0 && (
              <Button
                size="small"
                onClick={async () => {
                  await axios.patch('/api/notifications/read-all', {}, { headers })
                  queryClient.invalidateQueries({ queryKey: ['notifications'] })
                }}
              >
                סמן הכל כנקרא
              </Button>
            )}
          </Box>
          <Divider />

          {notifications.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4, px: 2 }}>
              אין התראות
            </Typography>
          ) : (
            <List disablePadding sx={{ maxHeight: 360, overflow: 'auto' }}>
              {notifications.map((n, i) => (
                <Box key={n._id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{ bgcolor: n.read ? 'transparent' : 'action.hover', py: 1.5 }}
                  >
                    <ListItemText
                      primary={n.message}
                      secondary={timeAgo(n.createdAt)}
                      slotProps={{
                        primary: { variant: 'body2', sx: { fontWeight: n.read ? 400 : 600 } },
                        secondary: { variant: 'caption' },
                      }}
                    />
                  </ListItem>
                  {i < notifications.length - 1 && <Divider component="li" />}
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  )
}
