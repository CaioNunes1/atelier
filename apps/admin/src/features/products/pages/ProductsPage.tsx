import { useState } from 'react'
import { Package, Plus, Pencil, Trash2, Search } from 'lucide-react'
import { PageHeader, Modal, EmptyState, LoadingRows, StatusBadge } from '@/components/ui'
import { ProductForm } from '../components/ProductForm'
import { useAdminProducts, useDeleteProduct } from '../hooks/useProducts'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Product, ProductFilters } from '@/types'

export function ProductsPage() {
  const [filters, setFilters] = useState<ProductFilters>({ page: 1, per_page: 20 })
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | Product | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null)

  const { data, isLoading } = useAdminProducts({
    ...filters,
    search: search || undefined,
  })
  const { mutate: deleteProduct, isPending: deleting } = useDeleteProduct()

  const products = data?.data ?? []
  const meta     = data?.meta

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle={meta ? `${meta.total} produto${meta.total !== 1 ? 's' : ''} cadastrado${meta.total !== 1 ? 's' : ''}` : 'Gerencie seu catálogo'}
        action={
          <button onClick={() => setModal('create')} className="btn-primary">
            <Plus size={15} />
            Novo produto
          </button>
        }
      />

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
          <input
            type="text"
            placeholder="Buscar produto…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 py-2"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-admin-surface/40">
                {['Produto', 'Categoria', 'Preço', 'Estoque', 'Status', 'Criado em', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-body font-medium text-admin-muted text-xs uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <LoadingRows cols={7} rows={6} />
              ) : !products.length ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<Package size={22} />}
                      title={search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                      description={search ? 'Tente outro termo de busca.' : 'Adicione seu primeiro produto para começar a vender.'}
                      action={!search ? (
                        <button onClick={() => setModal('create')} className="btn-primary">
                          <Plus size={14} /> Criar primeiro produto
                        </button>
                      ) : undefined}
                    />
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="border-b border-admin-border last:border-0 table-row-hover">
                    {/* Produto */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-9 h-9 rounded-lg object-cover border border-admin-border shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-admin-surface flex items-center justify-center shrink-0">
                            <Package size={14} className="text-admin-muted" />
                          </div>
                        )}
                        <div>
                          <p className="font-body font-medium text-admin-ink leading-tight">{product.name}</p>
                          {product.is_featured && (
                            <span className="text-[10px] font-body text-brand">✦ Destaque</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-body text-admin-muted text-xs">
                      {product.category?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 font-body font-medium text-admin-ink whitespace-nowrap">
                      {formatPrice(product.price_in_cents)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={product.stock === 0
                        ? 'text-red-600 font-body font-medium'
                        : product.stock <= 5
                          ? 'text-amber-600 font-body font-medium'
                          : 'font-body text-admin-ink'
                      }>
                        {product.stock} un.
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge active={product.is_active} /></td>
                    <td className="px-4 py-3.5 font-body text-admin-muted text-xs whitespace-nowrap">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setModal(product)} className="btn-ghost py-1.5 px-2" aria-label="Editar">
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(product)}
                          className="btn-ghost py-1.5 px-2 hover:text-red-600"
                          aria-label="Desativar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {meta && meta.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-admin-border">
            <p className="font-body text-xs text-admin-muted">
              Página {meta.page} de {meta.total_pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
                disabled={(filters.page ?? 1) <= 1}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Anterior
              </button>
              <button
                onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
                disabled={(filters.page ?? 1) >= meta.total_pages}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Novo produto' : 'Editar produto'}
        maxWidth="max-w-xl"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <ProductForm
            product={modal !== 'create' && modal !== null ? modal : undefined}
            onClose={() => setModal(null)}
          />
        </div>
      </Modal>

      {/* Modal confirmar desativação */}
      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Desativar produto"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="font-body text-sm text-admin-muted">
            O produto <span className="font-medium text-admin-ink">"{confirmDelete?.name}"</span> será
            desativado e ficará invisível na loja. Você pode reativá-lo a qualquer momento.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancelar</button>
            <button
              disabled={deleting}
              onClick={() => {
                if (confirmDelete) {
                  deleteProduct(confirmDelete.id)
                  setConfirmDelete(null)
                }
              }}
              className="btn-danger flex-1"
            >
              {deleting ? 'Desativando…' : 'Desativar'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
