 
import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { CatalogPage } from './features/catalog/pages/CatalogPage';
import { ProductDetailPage } from './features/catalog/pages/ProductDetailPage';
import { HomePage } from './routes/HomePage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { FavoritesPage } from './features/favorites/pages/FavoritesPage';
import { CheckoutPage } from './features/checkout/pages/CheckoutPage';
import { CartDrawer } from './features/cart/components/CartDrawer';
import { CartIcon } from './features/cart/components/CartIcon';
import { useCart } from './features/cart/hooks/useCart';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { CheckoutFailurePage, CheckoutPendingPage, CheckoutSuccessPage } from './features/checkout/pages/CheckoutResultPages';
import { Toaster } from 'sonner';
import { OrdersPage } from './features/profile/pages/OrdersPage';

function AppShell() {
  const [cartOpen, setCartOpen] = useState(false);
  const { cart, isAuthenticated, mergeGuestCart } = useCart();
  const { logout } = useAuth();

  const hasMerged = useRef(false)

  useEffect(() => {
    // Reseta a flag quando desloga para o próximo login funcionar
    if (!isAuthenticated) {
      hasMerged.current = false
      return
    }
    if (!hasMerged.current) {
      hasMerged.current = true
      mergeGuestCart()
    }
  }, [isAuthenticated, mergeGuestCart])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(248,228,224,0.85),_transparent_35%),linear-gradient(180deg,_#fffaf8_0%,_#fffdfd_100%)] text-stone-700">
      <header className="sticky top-0 z-20 border-b border-roseartisan-200/80 bg-white/80 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-4 py-4">
          <Link to="/" className="font-display text-2xl text-stone-900">
            Atelier
          </Link>
          <nav className="flex items-center gap-2 text-sm font-medium">
            <Link
              to="/"
              className="rounded-full px-4 py-2 transition hover:bg-roseartisan-50 hover:text-roseartisan-700"
            >
              Home
            </Link>
            <Link
              to="/catalog"
              className="rounded-full px-4 py-2 transition hover:bg-roseartisan-50 hover:text-roseartisan-700"
            >
              Catálogo
            </Link>
            <Link
              to="/profile/favorites"
              className="rounded-full px-4 py-2 transition hover:bg-roseartisan-50 hover:text-roseartisan-700"
            >
              Favoritos
            </Link>
            {!isAuthenticated && (
              <nav>
                <Link
                  to="/cadastro"
                  className="rounded-full px-4 py-2 transition hover:bg-roseartisan-50 hover:text-roseartisan-700"
                >
                  Cadastro
                </Link>
                <Link
                to="/login"
                className="rounded-full px-4 py-2 transition hover:bg-roseartisan-50 hover:text-roseartisan-700"
              >
                Login
              </Link>
            </nav>
            )}
            {isAuthenticated && (
              <div>
              <Link
              to="/profile/orders"
              className="rounded-full px-4 py-2 transition hover:bg-roseartisan-50 hover:text-roseartisan-700"
            >
              Pedidos
            </Link>
                  <button
                  type="button"
                   
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onClick={() => logout()}
                  className="rounded-full px-4 py-2 text-roseartisan-700 transition hover:bg-roseartisan-50 hover:text-roseartisan-800"
                >
                  Sair
                </button>
            </div>
            
            )}
            
            <CartIcon totalItems={cart.total_items} onClick={() => setCartOpen(true)} />
          </nav>
        </div>
      </header>

      <main className="container-page py-8 sm:py-10">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/profile/favorites" element={<FavoritesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/checkout/sucesso"  element={<CheckoutSuccessPage />} />
          <Route path="/checkout/falha"    element={<CheckoutFailurePage />} />
          <Route path="/checkout/pendente" element={<CheckoutPendingPage />} />
          <Route path="/profile/orders" element={<OrdersPage />} />
        </Routes>
      </main>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
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
      </BrowserRouter>
    </AuthProvider>
  );
}
