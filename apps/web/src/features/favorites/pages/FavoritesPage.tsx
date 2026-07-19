import { Link } from 'react-router-dom';
import { ProductGrid } from '@/features/catalog/components/ProductGrid';
import { useIsAuthenticated } from '@/features/auth/hooks/useAuthMutations';
import { useFavorites } from '../hooks/useFavorites';

export function FavoritesPage() {
  const { data: favorites = [], isLoading } = useFavorites();
  const authenticated = useIsAuthenticated();
  const products = favorites.map((favorite) => favorite.product);

  if (!authenticated) {
    return (
      <section className="card-surface mx-auto max-w-2xl space-y-4 px-6 py-16 text-center">
        <p className="artisan-pill mx-auto">Favoritos</p>
        <h1 className="text-4xl">Faça login para ver seus favoritos</h1>
        <p className="text-stone-600">Esse conteúdo é exclusivo da sua conta.</p>
        <Link
          to="/login"
          className="inline-flex rounded-full bg-roseartisan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-roseartisan-800"
        >
          Ir para login
        </Link>
      </section>
    );
  }

  if (!isLoading && products.length === 0) {
    return (
      <section className="card-surface space-y-4 px-6 py-16 text-center">
        <p className="artisan-pill mx-auto">Favoritos</p>
        <h1 className="text-4xl">Ainda não há favoritos</h1>
        <p className="text-stone-600">Salve as peças que mais gostou para encontrá-las aqui depois.</p>
        <Link
          to="/catalog"
          className="inline-flex rounded-full bg-roseartisan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-roseartisan-800"
        >
          Ir para o catálogo
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-roseartisan-700">Favoritos</p>
        <h1 className="mt-1 text-4xl">Sua seleção especial</h1>
      </div>

      <ProductGrid products={products} loading={isLoading} emptyMessage="Sem favoritos por enquanto." />
    </section>
  );
}
