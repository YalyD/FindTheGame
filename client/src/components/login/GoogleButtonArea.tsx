import { Alert, Box, CircularProgress, Typography } from '@mui/material'
import { LOGIN } from '../../constants'

interface Props {
  btnRef: React.RefObject<HTMLDivElement | null>
  googleReady: boolean
  error: string | null
}

export function GoogleButtonArea({ btnRef, googleReady, error }: Props) {
  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2, textAlign: 'right' }}>
          {error}
        </Alert>
      )}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 44,
          direction: 'ltr',
        }}
      >
        <div ref={btnRef} />
        {!googleReady && !error && <CircularProgress size={24} />}
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 2.5, opacity: 0.75 }}
      >
        {LOGIN.secureLogin}
      </Typography>
    </>
  )
}
