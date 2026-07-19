import { Link } from 'react-router-dom';
import heroImage from '@/assets/hero.png';
import { ProductGrid } from '@/features/catalog/components/ProductGrid';
import { useFeaturedProducts } from '@/features/catalog/hooks/useProducts';

export function HomePage() {
  const { data: featuredProducts = [], isLoading } = useFeaturedProducts();

  return (
    <div className="space-y-12">
      <section className="card-surface overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="space-y-6 p-6 sm:p-10">
            <span className="artisan-pill">Atelier artesanal</span>
            <div className="space-y-4">
              <h1 className="max-w-xl text-5xl leading-tight sm:text-6xl">
                Peças delicadas para viver e presentear com afeto
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-stone-600">
                Bolsas, nécessaires e acessórios com acabamento cuidadoso, paleta rose-nude-terra e
                destaque para o feito à mão.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/catalog"
                className="rounded-full bg-roseartisan-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-roseartisan-800"
              >
                Ver catálogo
              </Link>
              <a
                href="#featured"
                className="rounded-full border border-roseartisan-200 px-6 py-3 text-sm font-semibold text-roseartisan-700 transition hover:bg-roseartisan-50"
              >
                Destaques da semana
              </a>
            </div>
          </div>

          <div className="relative p-6 sm:p-10">
            <div className="absolute inset-8 rounded-[2.5rem] bg-roseartisan-100/70 blur-3xl" />
            <img
              src={heroImage}
              alt="Peças artesanais em tons rosados"
              className="relative mx-auto w-full max-w-md rounded-[2.5rem] object-cover shadow-soft"
            />
          </div>
        </div>
      </section>

      <section id="featured" className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-roseartisan-700">Destaques</p>
            <h2 className="mt-1 text-3xl">Produtos em evidência</h2>
          </div>
          <Link to="/catalog" className="text-sm font-medium text-roseartisan-700 hover:text-roseartisan-800">
            Ver catálogo completo
          </Link>
        </div>

        <ProductGrid
          products={featuredProducts}
          loading={isLoading}
          emptyMessage="Ainda não existem produtos em destaque."
          gridClassName="sm:grid-cols-2 xl:grid-cols-4"
        />
      </section>
    </div>
  );
}
