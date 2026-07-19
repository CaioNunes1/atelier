import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatPrice } from '@/lib/utils';
import { ProductFilters } from '../components/ProductFilters';
import { ProductGrid } from '../components/ProductGrid';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import type { ProductOrder, ProductSort, ProductsFilters } from '../types';

function toNumber(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toPrice(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : Math.round(parsed);
}

function getPageItems(currentPage: number, totalPages: number) {
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (!pages.includes(1)) {
    pages.unshift(1);
  }
  if (!pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return [...new Set(pages)].sort((a, b) => a - b);
}

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();

  const filters = useMemo<ProductsFilters>(() => {
    const sort = searchParams.get('sort');
    const order = searchParams.get('order');
    const selectedSort: ProductSort = sort === 'price' || sort === 'name' || sort === 'created_at' ? sort : 'created_at';
    const selectedOrder: ProductOrder = order === 'asc' || order === 'desc' ? order : 'desc';

    return {
      category: searchParams.get('category') ?? undefined,
      min_price: toPrice(searchParams.get('min_price')),
      max_price: toPrice(searchParams.get('max_price')),
      sort: selectedSort,
      order: selectedOrder,
      search: searchParams.get('search') ?? undefined,
      page: toNumber(searchParams.get('page')) ?? 1,
      per_page: 12,
    };
  }, [searchParams]);

  const { data, isLoading } = useProducts(filters);

  const updateFilters = (patch: Partial<ProductsFilters>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        next.delete(key);
        return;
      }

      next.set(key, String(value));
    });

    if (resetPage) {
      next.set('page', '1');
    }

    setSearchParams(next, { replace: true });
  };

  const currentPage = data?.meta.page ?? 1;
  const totalPages = data?.meta.total_pages ?? 1;
  const pageItems = getPageItems(currentPage, totalPages);

  return (
    <div className="space-y-10">
      <section className="card-surface overflow-hidden p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-5">
            <span className="artisan-pill">Catálogo</span>
            <div className="space-y-3">
              <h1 className="text-4xl leading-tight sm:text-5xl">Peças artesanais com alma feminina</h1>
              <p className="max-w-2xl text-base leading-7 text-stone-600">
                Explore bolsas, acessórios e presentes feitos com cuidado, acabamento delicado e paleta em
                tons quentes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/"
                className="rounded-full bg-roseartisan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-roseartisan-800"
              >
                Voltar para a home
              </Link>
              <button
                type="button"
                onClick={() => updateFilters({}, true)}
                className="rounded-full border border-roseartisan-200 px-5 py-3 text-sm font-semibold text-roseartisan-700 transition hover:bg-roseartisan-50"
              >
                Limpar filtros
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-roseartisan-100 via-white to-roseartisan-200 p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-roseartisan-700">Pesquisa ativa</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl bg-white/80 p-4">
                <span className="block text-stone-500">Categoria</span>
                <strong className="mt-1 block text-stone-900">
                  {filters.category ? categories.find((category) => category.slug === filters.category)?.name ?? 'Selecionada' : 'Todas'}
                </strong>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <span className="block text-stone-500">Ordenação</span>
                <strong className="mt-1 block text-stone-900">
                  {filters.sort === 'price'
                    ? filters.order === 'asc'
                      ? 'Menor preço'
                      : 'Maior preço'
                    : 'Mais recentes'}
                </strong>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <span className="block text-stone-500">Faixa mínima</span>
                <strong className="mt-1 block text-stone-900">
                  {filters.min_price !== undefined ? formatPrice(filters.min_price) : 'Livre'}
                </strong>
              </div>
              <div className="rounded-2xl bg-white/80 p-4">
                <span className="block text-stone-500">Faixa máxima</span>
                <strong className="mt-1 block text-stone-900">
                  {filters.max_price !== undefined ? formatPrice(filters.max_price) : 'Livre'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <ProductFilters
          categories={categories}
          filters={filters}
          onChange={(patch) => updateFilters(patch)}
          onReset={() => {
            setSearchParams({}, { replace: true });
          }}
          className="h-fit"
        />

        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-roseartisan-700">Produtos</p>
              <h2 className="mt-1 text-2xl">Selecionados para você</h2>
            </div>
            <p className="text-sm text-stone-500">
              {data ? `${data.meta.total} resultado(s)` : 'Carregando catálogo...'}
            </p>
          </div>

          <ProductGrid
            products={data?.data ?? []}
            loading={isLoading || isLoadingCategories}
            emptyMessage="Ajuste os filtros para encontrar outros produtos."
            gridClassName="sm:grid-cols-2 xl:grid-cols-3"
          />

          {data && data.meta.total_pages > 1 ? (
            <nav className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => updateFilters({ page: currentPage - 1 }, false)}
                className="rounded-full border border-roseartisan-200 px-4 py-2 text-sm font-medium text-stone-700 transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>

              {pageItems.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => updateFilters({ page }, false)}
                  className={
                    page === currentPage
                      ? 'rounded-full bg-roseartisan-700 px-4 py-2 text-sm font-semibold text-white'
                      : 'rounded-full border border-roseartisan-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-roseartisan-50'
                  }
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => updateFilters({ page: currentPage + 1 }, false)}
                className="rounded-full border border-roseartisan-200 px-4 py-2 text-sm font-medium text-stone-700 transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
              </button>
            </nav>
          ) : null}
        </section>
      </div>
    </div>
  );
}
