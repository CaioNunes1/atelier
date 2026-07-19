import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'

/** Redireciona para /login se não autenticado */
export function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <AuthLoadingScreen />
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <Outlet />
}

/** Redireciona para / se já autenticado (evita acessar /login logado) */
export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <AuthLoadingScreen />
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}

/** Tela de carregamento enquanto verifica sessão */
function AuthLoadingScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-linen-200 border-t-brand animate-spin" />
        <p className="font-body text-sm text-ink-faint">Carregando…</p>
      </div>
    </div>
  )
}
