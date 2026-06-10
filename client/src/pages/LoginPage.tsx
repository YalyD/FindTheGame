import { Box, Container, Paper } from '@mui/material'
import { BrandLogo } from '../components/login/BrandLogo'
import { FeatureHighlights } from '../components/login/FeatureHighlights'
import { GoogleButtonArea } from '../components/login/GoogleButtonArea'
import { BackgroundOrbs } from '../components/login/BackgroundOrbs'

interface Props {
  btnRef: React.RefObject<HTMLDivElement | null>
  googleReady: boolean
  error: string | null
}

export function LoginPage({ btnRef, googleReady, error }: Props) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #fff3c4 0%, #ffd180 55%, #ffab40 100%)',
        py: 4,
        px: 2,
      }}
    >
      <BackgroundOrbs />

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3.5, sm: 5 },
            borderRadius: 4,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.78)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow:
              '0 24px 60px -20px rgba(239, 108, 0, 0.28), 0 8px 24px -8px rgba(249, 168, 37, 0.22)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #fdd835 0%, #ffab40 50%, #ef6c00 100%)',
            },
          }}
        >
          <BrandLogo />
          <FeatureHighlights />
          <GoogleButtonArea btnRef={btnRef} googleReady={googleReady} error={error} />
        </Paper>
      </Container>
    </Box>
  )
}
