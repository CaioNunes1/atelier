import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import { useCart } from '../hooks/useCart';

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cart, isLoading, updateQuantity, removeItem, clearCart } = useCart();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-stone-900/35" onClick={onClose} aria-label="Fechar carrinho" />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-[0_20px_60px_rgba(120,63,54,0.25)]">
        <div className="flex items-center justify-between border-b border-roseartisan-200 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-roseartisan-700">Seu carrinho</p>
            <h2 className="mt-1 text-2xl">Itens selecionados</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 transition hover:bg-roseartisan-50 hover:text-roseartisan-700"
            aria-label="Fechar"
          >
            x
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-24 animate-pulse rounded-2xl bg-roseartisan-100" />
              <div className="h-24 animate-pulse rounded-2xl bg-roseartisan-100" />
            </div>
          ) : cart.items.length > 0 ? (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onIncrease={() => updateQuantity(item, item.quantity + 1)}
                  onDecrease={() =>
                    item.quantity <= 1 ? removeItem(item) : updateQuantity(item, item.quantity - 1)
                  }
                  onRemove={() => removeItem(item)}
                />
              ))}
              <button
                type="button"
                onClick={clearCart}
                className="text-sm font-medium text-stone-500 transition hover:text-roseartisan-700"
              >
                Limpar carrinho
              </button>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-display text-3xl text-stone-900">Carrinho vazio</p>
              <p className="mt-3 text-stone-600">Escolha algumas peças para começar.</p>
            </div>
          )}
        </div>

        <div className="border-t border-roseartisan-200 p-5">
          <CartSummary subtotalInCents={cart.subtotal_in_cents} onClose={onClose} />
        </div>
      </aside>
    </div>
  );
}
