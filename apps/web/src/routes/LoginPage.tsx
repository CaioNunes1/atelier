import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { PrivateRoute, PublicOnlyRoute } from './guards'

// Lazy loading de todas as páginas
const LoginPage         = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage      = lazy(() => import('@/features/auth/pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))

// Placeholder para páginas ainda não implementadas
function ComingSoon({ label }: { label: string }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface">
      <p className="font-display text-display-sm text-ink-muted">{label} — em breve</p>
    </div>
  )
}

const PageLoader = () => (
  <div className="min-h-dvh flex items-center justify-center bg-surface">
    <div className="w-8 h-8 rounded-full border-2 border-linen-200 border-t-brand animate-spin" />
  </div>
)

const router = createBrowserRouter([
  // Rotas públicas (somente não autenticados)
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login',               element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense> },
      { path: '/cadastro',            element: <Suspense fallback={<PageLoader />}><RegisterPage /></Suspense> },
      { path: '/esqueci-minha-senha', element: <Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense> },
    ],
  },

  // Rota de reset de senha (acessível sem login)
  {
    path: '/redefinir-senha',
    element: <Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>,
  },

  // Rotas privadas (requerem autenticação)
  {
    element: <PrivateRoute />,
    children: [
      { path: '/minha-conta',  element: <ComingSoon label="Minha conta" /> },
      { path: '/pedidos',      element: <ComingSoon label="Meus pedidos" /> },
      { path: '/favoritos',    element: <ComingSoon label="Favoritos" /> },
      { path: '/checkout',     element: <ComingSoon label="Checkout" /> },
    ],
  },

  // Rotas públicas gerais
  { path: '/',           element: <ComingSoon label="Home" /> },
  { path: '/catalogo',   element: <ComingSoon label="Catálogo" /> },
  { path: '/produto/:slug', element: <ComingSoon label="Produto" /> },

  // 404
  { path: '*', element: <ComingSoon label="Página não encontrada" /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
