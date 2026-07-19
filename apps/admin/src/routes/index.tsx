import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { AdminLayout } from '@/components/layout/AdminLayout'

// Lazy pages
const AdminLoginPage  = lazy(() => import('@/features/auth/pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })))
const DashboardPage   = lazy(() => import('@/features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ProductsPage    = lazy(() => import('@/features/products/pages/ProductsPage').then(m => ({ default: m.ProductsPage })))
const CategoriesPage  = lazy(() => import('@/features/categories/pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })))
const CouponsPage     = lazy(() => import('@/features/coupons/pages/CouponsPage').then(m => ({ default: m.CouponsPage })))
const OrdersPage      = lazy(() => import('@/features/orders/pages/OrdersPage').then(m => ({ default: m.OrdersPage })))

const Loader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-7 h-7 rounded-full border-2 border-admin-border border-t-brand animate-spin" />
  </div>
)

// Guard: redireciona /admin/login se já autenticado
function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <Loader />
  if (isAuthenticated) return <Navigate to="/admin" replace />
  return <Outlet />
}

// Guard: redireciona para /admin/login se não autenticado
function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return (
    <div className="min-h-dvh bg-admin-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-admin-border border-t-brand animate-spin" />
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  return <Outlet />
}

const router = createBrowserRouter([
  // Login
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/admin/login',
        element: <Suspense fallback={<Loader />}><AdminLoginPage /></Suspense>,
      },
    ],
  },
  // Painel protegido
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin',            element: <Suspense fallback={<Loader />}><DashboardPage /></Suspense> },
          { path: '/admin/produtos',   element: <Suspense fallback={<Loader />}><ProductsPage /></Suspense> },
          { path: '/admin/categorias', element: <Suspense fallback={<Loader />}><CategoriesPage /></Suspense> },
          { path: '/admin/cupons',     element: <Suspense fallback={<Loader />}><CouponsPage /></Suspense> },
          { path: '/admin/pedidos',    element: <Suspense fallback={<Loader />}><OrdersPage /></Suspense> },
        ],
      },
    ],
  },
  // Fallback
  { path: '*', element: <Navigate to="/admin" replace /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
