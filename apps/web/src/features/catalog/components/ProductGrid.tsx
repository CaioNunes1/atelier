import { cn } from '@/lib/utils';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';

type ProductGridProps = {
  products: Product[];
  loading?: boolean;
  emptyMessage?: string;
  gridClassName?: string;
};

function ProductSkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-roseartisan-200 bg-white/85 shadow-soft">
      <div className="aspect-[4/5] animate-pulse bg-gradient-to-br from-roseartisan-100 to-roseartisan-200" />
      <div className="space-y-4 p-5">
        <div className="h-5 w-24 animate-pulse rounded-full bg-roseartisan-100" />
        <div className="space-y-2">
          <div className="h-6 w-4/5 animate-pulse rounded bg-roseartisan-100" />
          <div className="h-4 w-full animate-pulse rounded bg-roseartisan-100" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-roseartisan-100" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-5 w-28 animate-pulse rounded bg-roseartisan-100" />
          <div className="h-4 w-20 animate-pulse rounded bg-roseartisan-100" />
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  loading = false,
  emptyMessage = 'Nenhum produto encontrado.',
  gridClassName = 'sm:grid-cols-2 xl:grid-cols-3',
}: ProductGridProps) {
  if (loading) {
    return (
      <div className={cn('grid gap-6', gridClassName)}>
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductSkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-roseartisan-300 bg-white/80 px-6 py-16 text-center shadow-soft">
        <p className="font-display text-3xl text-stone-900">Nada por aqui ainda</p>
        <p className="mt-3 text-stone-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-6', gridClassName)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
