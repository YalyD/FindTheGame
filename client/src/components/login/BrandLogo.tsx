import { Box, Stack, Typography } from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import { BRAND_NAME, LOGIN } from '../../constants'

export function BrandLogo() {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', mb: 3 }}>
      <Box
        sx={{
          width: 84,
          height: 84,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          background: 'linear-gradient(135deg, #ffd54f 0%, #ffab40 55%, #ef6c00 100%)',
          boxShadow:
            '0 12px 28px -8px rgba(239, 108, 0, 0.55), inset 0 -4px 10px rgba(0,0,0,0.08), inset 0 2px 6px rgba(255,255,255,0.5)',
        }}
      >
        <SportsSoccerIcon sx={{ fontSize: 46, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }} />
      </Box>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #ef6c00 0%, #f9a825 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {BRAND_NAME}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280 }}>
        {LOGIN.tagline}
      </Typography>
    </Stack>
  )
}
