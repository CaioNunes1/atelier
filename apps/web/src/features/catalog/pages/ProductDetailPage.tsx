import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CategoryBadge } from '../components/CategoryBadge';
import { useProduct } from '../hooks/useProduct';
import { cn, formatPrice } from '@/lib/utils';
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import { useCart } from '@/features/cart/hooks/useCart';
import { toCartItemInput } from '@/features/cart/utils';

export function ProductDetailPage() {
  const { slug = '' } = useParams();
  const { data: product, isLoading, isError } = useProduct(slug);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    setSelectedImageId(null);
  }, [product?.slug]);

  const selectedImage = useMemo(() => {
    if (!product || product.images.length === 0) {
      return null;
    }

    return product.images.find((image) => image.id === selectedImageId) ?? product.images[0];
  }, [product, selectedImageId]);

  if (isLoading) {
    return <div className="card-surface min-h-[60vh] animate-pulse p-8" />;
  }

  if (isError || !product) {
    return (
      <div className="card-surface mx-auto max-w-3xl space-y-4 px-6 py-16 text-center">
        <p className="artisan-pill mx-auto">Produto</p>
        <h1 className="text-4xl">Produto não encontrado</h1>
        <p className="text-stone-600">Tente voltar ao catálogo para encontrar outra peça.</p>
        <Link
          to="/catalog"
          className="inline-flex rounded-full bg-roseartisan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-roseartisan-800"
        >
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link to="/catalog" className="inline-flex items-center text-sm font-medium text-roseartisan-700 hover:text-roseartisan-800">
        ← Voltar ao catálogo
      </Link>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[2rem] border border-roseartisan-200 bg-white shadow-soft">
            <div className="aspect-square bg-gradient-to-br from-roseartisan-100 via-white to-roseartisan-200">
              {selectedImage ? (
                <img src={selectedImage.url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-10 text-center font-display text-3xl text-roseartisan-800">
                  {product.name}
                </div>
              )}
            </div>
          </div>

          {product.images.length > 1 ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImageId(image.id)}
                  className={cn(
                    'h-24 w-24 flex-none overflow-hidden rounded-2xl border-2 transition',
                    selectedImage?.id === image.id ? 'border-roseartisan-500' : 'border-transparent',
                  )}
                >
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="card-surface space-y-6 p-6 sm:p-8">
          <div className="space-y-4">
            <CategoryBadge name={product.category.name} slug={product.category.slug} />
            <div className="space-y-3">
              <h1 className="text-4xl leading-tight">{product.name}</h1>
              <p className="text-3xl font-semibold text-roseartisan-800">{formatPrice(product.price_in_cents)}</p>
            </div>
            <p className={cn('text-sm font-medium', product.is_available ? 'text-emerald-700' : 'text-rose-700')}>
              {product.is_available ? 'Disponível em estoque' : 'Esgotado'}
            </p>
          </div>

          {product.description ? (
            <p className="text-base leading-7 text-stone-600">{product.description}</p>
          ) : null}

          {product.variants.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-lg">Variações</h2>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="rounded-full border border-roseartisan-200 bg-roseartisan-50 px-4 py-2 text-sm text-stone-700"
                  >
                    <span className="font-medium">{variant.name}</span>
                    <span className="ml-2 text-stone-500">
                      {variant.price_modifier_in_cents ? `+ ${formatPrice(variant.price_modifier_in_cents)}` : 'Sem acréscimo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={!product.is_available}
              onClick={() => addItem(toCartItemInput(product))}
              className="rounded-full bg-roseartisan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-roseartisan-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Adicionar ao carrinho
            </button>
            <FavoriteButton product={product} />
          </div>

          <div className="rounded-2xl bg-roseartisan-50 p-4 text-sm text-stone-600">
            As ações de compra e favoritos entram na Fase 5.
          </div>
        </div>
      </section>
    </div>
  );
}
