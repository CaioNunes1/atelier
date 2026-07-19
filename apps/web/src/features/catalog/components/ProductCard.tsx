import { Link } from 'react-router-dom';
import { formatPrice, cn } from '@/lib/utils';
import type { Product } from '../types';
import { CategoryBadge } from './CategoryBadge';
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import { useCart } from '@/features/cart/hooks/useCart';

type ProductCardProps = {
  product: Product;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const image = product.images[0];
  const { addItem } = useCart();

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-3xl border border-roseartisan-200 bg-white/90 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(130,63,51,0.16)]',
        className,
      )}
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-roseartisan-100 via-white to-roseartisan-200">
          {image ? (
            <img
              src={image.url}
              alt={product.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-roseartisan-700">
              {product.name}
            </div>
          )}

          <div className="absolute left-4 top-4 flex gap-2">
            {product.is_featured ? <span className="artisan-pill">Destaque</span> : null}
            {!product.is_available ? <span className="artisan-pill border-roseartisan-300 text-roseartisan-900">Esgotado</span> : null}
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <CategoryBadge name={product.category.name} slug={product.category.slug} />

        <div className="space-y-2">
          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="font-display text-2xl leading-tight text-stone-900 transition group-hover:text-roseartisan-700">
              {product.name}
            </h3>
          </Link>
          {product.description ? (
            <p className="line-clamp-2 text-sm leading-6 text-stone-600">{product.description}</p>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Preço</p>
            <p className="text-lg font-semibold text-stone-900">{formatPrice(product.price_in_cents)}</p>
          </div>
          <p className={cn('text-sm font-medium', product.is_available ? 'text-emerald-700' : 'text-rose-700')}>
            {product.is_available ? 'Disponível' : 'Esgotado'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!product.is_available}
            onClick={() => addItem({
              product_id: product.id,
              quantity: 1,
              variant_id: undefined,
              product:{
                id: product.id,
                name: product.name,
                slug: product.slug,
                stock: product.stock,
                price_in_cents: product.price_in_cents,
                image: product.images[0] ?? null,
                is_active: false,
                category: {
                  id: product.category.id,
                  name: product.category.name,
                  slug: product.category.slug,
                }
              },
            })}
            className="flex-1 rounded-full bg-roseartisan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-roseartisan-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Adicionar ao carrinho
          </button>
          
          <FavoriteButton product={product} compact />
        </div>
      </div>
    </article>
  );
}
