import { Box, Typography } from '@mui/material'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import { LOGIN } from '../../constants'

export function FeatureHighlights() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3.5 }}>
      <Box sx={{ flex: '0 0 auto', minWidth: 96, textAlign: 'center' }}>
        <SportsSoccerIcon
          sx={{ display: 'block', mx: 'auto', mb: 0.5, color: '#ef6c00', fontSize: 24 }}
        />
        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#b53d00' }}>
          {LOGIN.featureFindRides}
        </Typography>
      </Box>
      <Box sx={{ flex: '0 0 auto', minWidth: 96, textAlign: 'center' }}>
        <DirectionsCarIcon
          sx={{ display: 'block', mx: 'auto', mb: 0.5, color: '#f9a825', fontSize: 24 }}
        />
        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#a06600' }}>
          {LOGIN.featureOfferRides}
        </Typography>
      </Box>
    </Box>
  )
}
