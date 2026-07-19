import { useState } from 'react'
import { Plus, Tag, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader, Modal, EmptyState, LoadingRows, StatusBadge, Toggle } from '@/components/ui'
import { useAdminCategories, useCreateCategory, useUpdateCategory } from '../hooks/useCategories'
import { formatDate } from '@/lib/utils'
import type { Category } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(80, 'Nome muito longo'),
  is_active: z.boolean(),
})
type FormData = z.infer<typeof schema>

// ─── Modal de criação/edição ──────────────────────────────────────────────────
function CategoryForm({
  category,
  onClose,
}: {
  category?: Category
  onClose: () => void
}) {
  const isEditing = !!category
  const { mutate: create, isPending: creating } = useCreateCategory(onClose)
  const { mutate: update, isPending: updating } = useUpdateCategory(onClose)
  const isPending = creating || updating

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      is_active: category?.is_active ?? true,
    },
  })

  const isActive = watch('is_active')

  const onSubmit = (data: FormData) => {
    if (isEditing) update({ id: category.id, ...data })
    else create(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="input-label">Nome da categoria</label>
        <input
          type="text"
          placeholder="Ex: Bolsas, Necessaires…"
          className="input-field"
          {...register('name')}
        />
        {errors.name && <p className="input-error">{errors.name.message}</p>}
      </div>

      <Toggle
        checked={isActive}
        onChange={(v) => setValue('is_active', v)}
        label="Categoria ativa (visível na loja)"
      />

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={isPending} className="btn-primary flex-1">
          {isPending ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Criar categoria'}
        </button>
      </div>
    </form>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function CategoriesPage() {
  const [modal, setModal] = useState<'create' | Category | null>(null)
  const { data: categories, isLoading } = useAdminCategories()

  return (
    <>
      <PageHeader
        title="Categorias"
        subtitle="Organize os produtos por tipo"
        action={
          <button onClick={() => setModal('create')} className="btn-primary">
            <Plus size={15} />
            Nova categoria
          </button>
        }
      />

      <div className="admin-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-admin-border bg-admin-surface/40">
              <th className="text-left px-4 py-3 font-body font-medium text-admin-muted text-xs uppercase tracking-wider">Nome</th>
              <th className="text-left px-4 py-3 font-body font-medium text-admin-muted text-xs uppercase tracking-wider">Slug</th>
              <th className="text-left px-4 py-3 font-body font-medium text-admin-muted text-xs uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 font-body font-medium text-admin-muted text-xs uppercase tracking-wider">Criada em</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingRows cols={5} rows={4} />
            ) : !categories?.length ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={<Tag size={22} />}
                    title="Nenhuma categoria ainda"
                    description="Crie a primeira categoria para começar a organizar seus produtos."
                    action={
                      <button onClick={() => setModal('create')} className="btn-primary">
                        <Plus size={14} /> Criar primeira categoria
                      </button>
                    }
                  />
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="border-b border-admin-border last:border-0 table-row-hover">
                  <td className="px-4 py-3.5 font-body font-medium text-admin-ink">{cat.name}</td>
                  <td className="px-4 py-3.5 font-body text-admin-muted font-mono text-xs">{cat.slug}</td>
                  <td className="px-4 py-3.5"><StatusBadge active={cat.is_active} /></td>
                  <td className="px-4 py-3.5 font-body text-admin-muted text-xs">{formatDate(cat.created_at)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setModal(cat)}
                      className="btn-ghost py-1.5 px-2.5"
                      aria-label="Editar categoria"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Nova categoria' : 'Editar categoria'}
      >
        <CategoryForm
          category={modal !== 'create' && modal !== null ? modal : undefined}
          onClose={() => setModal(null)}
        />
      </Modal>
    </>
  )
}
