import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'

const queryClient = new QueryClient()

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
    secondary: { main: '#f57c00' },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
