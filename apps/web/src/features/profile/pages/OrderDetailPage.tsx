import { Link, useParams } from 'react-router-dom';
import { formatDate, formatPrice } from '@/lib/utils';
import { useIsAuthenticated } from '@/features/auth/hooks/useAuthMutations';
import { useOrder } from '@/features/checkout/hooks/useCheckout';
import type { OrderStatus } from '@/features/checkout/types';

const TIMELINE: OrderStatus[] = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const authenticated = useIsAuthenticated();
  const { data: order, isLoading } = useOrder(id);

  if (!authenticated) {
    return (
      <section className="card-surface mx-auto max-w-2xl space-y-4 px-6 py-16 text-center">
        <h1 className="text-4xl">Entre para ver o pedido</h1>
        <Link to="/login" className="inline-flex rounded-full bg-roseartisan-700 px-5 py-3 text-sm font-semibold text-white">
          Ir para login
        </Link>
      </section>
    );
  }

  if (isLoading || !order) {
    return <div className="card-surface min-h-80 animate-pulse p-8" />;
  }

  const currentIndex = TIMELINE.indexOf(order.status);

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-roseartisan-700">Pedido #{order.id.slice(0, 8)}</p>
        <h1 className="mt-1 text-4xl">Detalhe do pedido</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="card-surface space-y-4 p-6">
            <h2 className="text-2xl">Itens</h2>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-roseartisan-200 p-4">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-stone-500">{item.variant_name ?? 'Sem variação'} • {item.quantity}x</p>
                </div>
                <p className="font-semibold text-roseartisan-700">{formatPrice(item.unit_price_in_cents * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="card-surface space-y-4 p-6">
            <h2 className="text-2xl">Linha do tempo</h2>
            <div className="space-y-3">
              {TIMELINE.map((status, index) => (
                <div
                  key={status}
                  className={
                    index <= currentIndex
                      ? 'rounded-2xl border border-roseartisan-500 bg-roseartisan-50 px-4 py-3 text-sm'
                      : 'rounded-2xl border border-roseartisan-200 px-4 py-3 text-sm text-stone-500'
                  }
                >
                  {status}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card-surface space-y-3 p-6">
            <h2 className="text-2xl">Resumo</h2>
            <div className="flex justify-between text-sm"><span>Subtotal</span><strong>{formatPrice(order.subtotal_in_cents)}</strong></div>
            <div className="flex justify-between text-sm"><span>Desconto</span><strong>- {formatPrice(order.discount_in_cents)}</strong></div>
            <div className="flex justify-between text-sm"><span>Frete</span><strong>{formatPrice(order.shipping_in_cents)}</strong></div>
            <div className="border-t border-roseartisan-200 pt-2 flex justify-between"><span>Total</span><strong>{formatPrice(order.total_in_cents)}</strong></div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{order.status}</p>
          </div>

          <div className="card-surface space-y-3 p-6">
            <h2 className="text-2xl">Entrega</h2>
            {order.address ? (
              <p className="text-sm text-stone-600">
                {order.address.street}, {order.address.number} - {order.address.neighborhood}
                <br />
                {order.address.city}/{order.address.state} • {order.address.zip_code}
              </p>
            ) : null}
            {order.tracking_code ? <p className="text-sm text-stone-600">Rastreamento: {order.tracking_code}</p> : null}
            <p className="text-sm text-stone-500">Criado em {formatDate(order.created_at)}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
