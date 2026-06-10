import { Box } from '@mui/material'

export function BackgroundOrbs() {
  return (
    <>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: -120,
          insetInlineStart: -120,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,213,79,0.85), rgba(255,213,79,0) 70%)',
          filter: 'blur(20px)',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          bottom: -140,
          insetInlineEnd: -100,
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,138,57,0.8), rgba(255,138,57,0) 70%)',
          filter: 'blur(24px)',
        }}
      />
    </>
  )
}
