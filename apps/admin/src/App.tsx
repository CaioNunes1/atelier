import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/features/auth/AuthContext'
import { AppRouter } from '@/routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries:   { retry: 1, staleTime: 1000 * 60 * 2, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '13px',
              background: '#1E1B18',
              color: '#F7F4F1',
              border: '1px solid rgba(196,149,106,0.15)',
              top:' 40px',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
