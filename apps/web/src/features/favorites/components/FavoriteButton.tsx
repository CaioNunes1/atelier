import { useToggleFavorite } from '../hooks/useFavorites';
import type { Product } from '@/features/catalog/types';

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M12 21s-7.5-4.7-9.5-9.2C.9 8.4 2.7 5 6.3 4.2c2-.4 3.8.4 5.1 1.8 1.3-1.4 3.1-2.2 5.1-1.8C20.1 5 22 8.4 21.5 11.8 19.5 16.3 12 21 12 21z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type FavoriteButtonProps = {
  product: Product;
  className?: string;
  compact?: boolean;
};

export function FavoriteButton({ product, className, compact = false }: FavoriteButtonProps) {
  const mutation = useToggleFavorite(product);

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={
        className ??
        'inline-flex items-center justify-center gap-2 rounded-full border border-roseartisan-200 bg-white px-4 py-2 text-sm font-medium text-roseartisan-700 transition hover:bg-roseartisan-50 disabled:cursor-not-allowed disabled:opacity-60'
      }
      aria-label="Favoritar produto"
      title="Favoritar produto"
    >
      <HeartIcon filled={mutation.isFavorited} />
      {!compact ? <span>{mutation.isFavorited ? 'Favoritado' : 'Favoritar'}</span> : null}
    </button>
  );
}
