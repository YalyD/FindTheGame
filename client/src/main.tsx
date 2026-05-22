import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import rtlPlugin from 'stylis-plugin-rtl'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'

const queryClient = new QueryClient()

const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
})

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: { main: '#ef6c00', light: '#ff9d3f', dark: '#b53d00', contrastText: '#fff' },
    secondary: { main: '#f9a825', light: '#ffd95a', dark: '#c17900', contrastText: '#fff' },
    background: { default: '#fff8ee', paper: '#ffffff' },
  },
  typography: {
    fontFamily: 'Heebo, sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 800, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: 'linear-gradient(120deg, #d84315 0%, #ef6c00 45%, #f9a825 100%)',
          boxShadow: '0 6px 20px -10px rgba(239, 108, 0, 0.55)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(239, 108, 0, 0.14)',
          background: 'linear-gradient(180deg, #ffffff 0%, #fffbf3 100%)',
          transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 14px 32px -14px rgba(239, 108, 0, 0.28)',
            borderColor: 'rgba(239, 108, 0, 0.28)',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 12 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #ef6c00 0%, #f9a825 100%)',
          boxShadow: '0 6px 16px -6px rgba(239, 108, 0, 0.45)',
          '&:hover': {
            background: 'linear-gradient(135deg, #d85f00 0%, #e89a1f 100%)',
            boxShadow: '0 8px 20px -6px rgba(239, 108, 0, 0.55)',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(239, 108, 0, 0.5)',
          '&:hover': {
            borderColor: '#ef6c00',
            backgroundColor: 'rgba(239, 108, 0, 0.06)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 10, fontWeight: 600 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: { minHeight: 64 },
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CacheProvider value={cacheRtl}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </CacheProvider>
  </StrictMode>,
)
