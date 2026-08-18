 
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
import { OrderDetailPage } from './features/profile/pages/OrderDetailPage';
import { AccountPage } from './features/profile/pages/AccountPage';
import { PrivateRoute } from './routes/guards';

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

  const navLinkClass =
    'shrink-0 whitespace-nowrap rounded-full px-4 py-2 transition hover:bg-roseartisan-50 hover:text-roseartisan-700';

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(248,228,224,0.85),_transparent_35%),linear-gradient(180deg,_#fffaf8_0%,_#fffdfd_100%)] text-stone-700">
      <header className="sticky top-0 z-20 border-b border-roseartisan-200/80 bg-white/80 backdrop-blur">
        <div className="container-page py-3">

          {/* Desktop — tudo em uma linha */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <Link to="/" className="font-display text-2xl text-stone-900 shrink-0">
              Atelier
            </Link>

            <nav className="flex items-center gap-1 text-sm font-medium">
              <Link to="/" className={navLinkClass}>Home</Link>
              <Link to="/catalog" className={navLinkClass}>Catálogo</Link>
              <Link to="/profile/favorites" className={navLinkClass}>Favoritos</Link>

              {!isAuthenticated && (
                <>
                  <Link to="/login" className={navLinkClass}>Login</Link>
                  <Link to="/cadastro" className={navLinkClass}>Cadastro</Link>
                </>
              )}

              {isAuthenticated && (
                <>
                  <Link to="/profile/orders" className={navLinkClass}>Pedidos</Link>
                  <Link to="/profile/account" className={navLinkClass}>Minha conta</Link>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-roseartisan-700 transition hover:bg-roseartisan-50 hover:text-roseartisan-800"
                  >
                    Sair
                  </button>
                </>
              )}
            </nav>

            <CartIcon totalItems={cart.total_items} onClick={() => setCartOpen(true)} />
          </div>

          {/* Mobile — logo + carrinho em cima, nav scrollável embaixo */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between">
              <Link to="/" className="font-display text-2xl text-stone-900">
                Atelier
              </Link>
              <CartIcon totalItems={cart.total_items} onClick={() => setCartOpen(true)} />
            </div>

            <nav className="-mx-4 mt-2 overflow-x-auto px-4">
              <div className="flex w-max items-center gap-1 pb-1 text-sm font-medium">
                <Link to="/" className={navLinkClass}>Home</Link>
                <Link to="/catalog" className={navLinkClass}>Catálogo</Link>
                <Link to="/profile/favorites" className={navLinkClass}>Favoritos</Link>

                {!isAuthenticated && (
                  <>
                    <Link to="/login" className={navLinkClass}>Login</Link>
                    <Link to="/cadastro" className={navLinkClass}>Cadastro</Link>
                  </>
                )}

                {isAuthenticated && (
                  <>
                  <Link to="/profile/orders" className={navLinkClass}>Pedidos</Link>
                  <Link to="/profile/account" className={navLinkClass}>Minha conta</Link>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-roseartisan-700 transition hover:bg-roseartisan-50 hover:text-roseartisan-800"
                    >
                      Sair
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>

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
          <Route element={<PrivateRoute />}>
            <Route path="/profile/account" element={<AccountPage />} />
            <Route path="/profile/orders" element={<OrdersPage />} />
            <Route path="/profile/orders/:id" element={<OrderDetailPage />} />
          </Route>
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
