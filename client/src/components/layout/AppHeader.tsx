import {
  AppBar,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import LogoutIcon from '@mui/icons-material/Logout'
import EditIcon from '@mui/icons-material/Edit'
import { useState } from 'react'
import { BRAND_NAME, MAIN } from '../../constants'
import { NotificationsBell } from '../notifications/NotificationsBell'

type View = 'main' | 'activity'

interface Props {
  name: string
  token: string
  view: View
  onSelectView: (view: View) => void
  onEditProfile: () => void
  onLogout: () => void
}

// Sticky top bar: brand, view switcher, notifications and the account menu.
export function AppHeader({ name, token, view, onSelectView, onEditProfile, onLogout }: Props) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  return (
    <AppBar position="sticky" component="header">
      <Toolbar dir="ltr">
        <SportsSoccerIcon sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {BRAND_NAME}
        </Typography>
        <Tooltip title={MAIN.navUpcoming}>
          <IconButton
            color="inherit"
            onClick={() => onSelectView('main')}
            sx={{ opacity: view === 'main' ? 1 : 0.5 }}
          >
            <SportsSoccerIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={MAIN.navActivity}>
          <IconButton
            color="inherit"
            onClick={() => onSelectView('activity')}
            sx={{ mr: 0.5, opacity: view === 'activity' ? 1 : 0.5 }}
          >
            <DirectionsCarIcon />
          </IconButton>
        </Tooltip>
        <NotificationsBell token={token} />
        <Tooltip title={MAIN.account}>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="small" sx={{ mr: 0.5 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: 'rgba(255,255,255,0.22)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                border: '2px solid rgba(255,255,255,0.55)',
              }}
            >
              {name.charAt(0)}
            </Avatar>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={menuAnchor}
          open={!!menuAnchor}
          onClose={() => setMenuAnchor(null)}
          slotProps={{ paper: { sx: { minWidth: 180 } } }}
        >
          <MenuItem
            onClick={() => {
              setMenuAnchor(null)
              onEditProfile()
            }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1.5 }} />
            {MAIN.editProfile}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenuAnchor(null)
              onLogout()
            }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
            {MAIN.logout}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
