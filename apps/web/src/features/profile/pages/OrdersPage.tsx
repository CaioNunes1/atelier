import { Link } from 'react-router-dom';
import { useIsAuthenticated } from '@/features/auth/hooks/useAuthMutations';
import { formatPrice, formatDate } from '@/lib/utils';
import { useOrders } from '@/features/checkout/hooks/useCheckout';
import type { OrderStatus } from '@/features/checkout/types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  'PENDING_PAYMENT': 'bg-amber-100 text-amber-800',
  'PAID': 'bg-blue-100 text-blue-800',
  'PROCESSING': 'bg-purple-100 text-purple-800',
  'SHIPPED': 'bg-violet-100 text-violet-800',
  'DELIVERED': 'bg-emerald-100 text-emerald-800',
  'CANCELLED': 'bg-rose-100 text-rose-800',
};

export function OrdersPage() {
  const authenticated = useIsAuthenticated();
  const { data: orders = [], isLoading } = useOrders();

  if (!authenticated) {
    return (
      <section className="card-surface mx-auto max-w-2xl space-y-4 px-6 py-16 text-center">
        <p className="artisan-pill mx-auto">Pedidos</p>
        <h1 className="text-4xl">Entre para ver seus pedidos</h1>
        <Link to="/login" className="inline-flex rounded-full bg-roseartisan-700 px-5 py-3 text-sm font-semibold text-white">
          Ir para login
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-roseartisan-700">Pedidos</p>
        <h1 className="mt-1 text-4xl">Seu histórico de compras</h1>
      </div>

      {isLoading ? <div className="h-40 animate-pulse rounded-3xl bg-roseartisan-100" /> : null}

      <div className="space-y-4">
        {orders.map((order) => (
          <Link key={order.id} to={`/profile/orders/${order.id}`} className="card-surface block p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-stone-500">Pedido #{order.id.slice(0, 8)}</p>
                <h2 className="text-2xl">{formatPrice(order.total_in_cents)}</h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${STATUS_COLORS[order.status]}`}>
                {order.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-stone-500">{formatDate(order.created_at)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
