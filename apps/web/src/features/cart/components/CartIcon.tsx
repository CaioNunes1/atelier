import { cn } from '@/lib/utils';

type CartIconProps = {
  totalItems: number;
  onClick: () => void;
  className?: string;
};

export function CartIcon({ totalItems, onClick, className }: CartIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center gap-2 rounded-full border border-roseartisan-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-roseartisan-50 hover:text-roseartisan-700',
        className,
      )}
    >
      <span>Carrinho</span>
      {totalItems > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-roseartisan-700 px-1 text-[11px] font-semibold text-white">
          {totalItems}
        </span>
      ) : null}
    </button>
  );
}
