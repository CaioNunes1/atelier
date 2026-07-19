import { cn } from '../../../lib/utils';
import type { Category, ProductOrder, ProductSort, ProductsFilters } from '../types';

type ProductFiltersProps = {
  categories: Category[];
  filters: ProductsFilters;
  onChange: (next: Partial<ProductsFilters>) => void;
  onReset: () => void;
  className?: string;
};

type SortOption = {
  label: string;
  sort: ProductSort;
  order: ProductOrder;
};

const SORT_OPTIONS: SortOption[] = [
  { label: 'Mais recentes', sort: 'created_at', order: 'desc' },
  { label: 'Menor preço', sort: 'price', order: 'asc' },
  { label: 'Maior preço', sort: 'price', order: 'desc' },
];

function toDisplayPrice(cents?: number) {
  if (cents === undefined) {
    return '';
  }
  return (cents / 100).toFixed(2);
}

function toPriceInCents(value: string) {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value.replace(',', '.'));
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return Math.round(parsed * 100);
}

export function ProductFilters({ categories, filters, onChange, onReset, className }: ProductFiltersProps) {
  const activeSort =
    SORT_OPTIONS.find((option) => option.sort === filters.sort && option.order === filters.order) ?? SORT_OPTIONS[0];

  return (
    <aside className={cn('rounded-3xl border border-roseartisan-200 bg-white/85 p-5 shadow-soft backdrop-blur', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-roseartisan-700">Filtros</p>
          <h2 className="mt-2 text-2xl">Refinar catálogo</h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-roseartisan-200 px-4 py-2 text-sm font-medium text-roseartisan-700 transition hover:bg-roseartisan-50"
        >
          Limpar
        </button>
      </div>

      <div className="mt-6 space-y-6">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">Categoria</span>
          <select
            value={filters.category ?? ''}
            onChange={(event) => onChange({ category: event.target.value || undefined })}
            className="w-full rounded-2xl border border-roseartisan-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-roseartisan-400"
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Preço mínimo</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={toDisplayPrice(filters.min_price)}
              onChange={(event) => onChange({ min_price: toPriceInCents(event.target.value) })}
              placeholder="0,00"
              className="w-full rounded-2xl border border-roseartisan-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-roseartisan-400"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Preço máximo</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={toDisplayPrice(filters.max_price)}
              onChange={(event) => onChange({ max_price: toPriceInCents(event.target.value) })}
              placeholder="0,00"
              className="w-full rounded-2xl border border-roseartisan-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-roseartisan-400"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">Ordenação</span>
          <select
            value={`${activeSort.sort}:${activeSort.order}`}
            onChange={(event) => {
              const selected = SORT_OPTIONS.find((option) => `${option.sort}:${option.order}` === event.target.value);
              if (!selected) {
                return;
              }
              onChange({ sort: selected.sort, order: selected.order, page: 1 });
            }}
            className="w-full rounded-2xl border border-roseartisan-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-roseartisan-400"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={`${option.sort}:${option.order}`} value={`${option.sort}:${option.order}`}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </aside>
  );
}
