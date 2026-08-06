/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'

// Mantém o Render acordado — evita hibernação do plano gratuito
if (import.meta.env.PROD) {
  const API_URL = import.meta.env.VITE_API_URL ?? ''
  setInterval(() => {
    fetch(`${API_URL}/api/categories`, { method: 'GET' })
      .catch(() => {})
  }, 14 * 60 * 1000)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
