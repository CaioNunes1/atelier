import { Link } from 'react-router-dom';
import { formatPrice } from '../../../lib/utils';

type CartSummaryProps = {
  subtotalInCents: number;
  onClose: () => void;
};

export function CartSummary({ subtotalInCents, onClose }: CartSummaryProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-roseartisan-200 bg-roseartisan-50 p-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-stone-600">Subtotal</span>
        <strong className="text-stone-900">{formatPrice(subtotalInCents)}</strong>
      </div>
      <Link
        to="/checkout"
        onClick={() => onClose()}
        className="flex w-full items-center justify-center rounded-full bg-roseartisan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-roseartisan-800"
      >
        Ir para checkout
      </Link>
    </div>
  );
}
