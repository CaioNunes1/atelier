import { formatPrice } from '@/lib/utils';
import type { CartItem as CartItemType } from '../types';

type CartItemProps = {
  item: CartItemType;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
};

function MinusIcon() {
  return <span aria-hidden="true">-</span>;
}

function PlusIcon() {
  return <span aria-hidden="true">+</span>;
}

function TrashIcon() {
  return <span aria-hidden="true">x</span>;
}

export function CartItem({ item, onIncrease, onDecrease, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-4 rounded-2xl border border-roseartisan-200 bg-white p-4">
      <div className="h-20 w-20 flex-none overflow-hidden rounded-2xl bg-roseartisan-100">
        {item.product.image ? (
          <img src={item.product.image.url} alt={item.product.name} className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-medium text-stone-900">{item.product.name}</h3>
            {item.variant ? <p className="text-sm text-stone-500">{item.variant.name}</p> : null}
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full p-2 text-stone-400 transition hover:bg-roseartisan-50 hover:text-roseartisan-700"
            aria-label="Remover item"
          >
            <TrashIcon />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-roseartisan-700">{formatPrice(item.unit_price_in_cents)}</p>

          <div className="flex items-center gap-2 rounded-full border border-roseartisan-200 bg-roseartisan-50 px-2 py-1">
            <button type="button" onClick={onDecrease} className="rounded-full p-1 text-roseartisan-700">
              <MinusIcon />
            </button>
            <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
            <button type="button" onClick={onIncrease} className="rounded-full p-1 text-roseartisan-700">
              <PlusIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
