/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { Toggle } from '@/components/ui'
import { useAdminCategories } from '@/features/categories/hooks/useCategories'
import { useCreateProduct, useUpdateProduct, useUploadProductImage, useDeleteProductImage } from '../hooks/useProducts'
import { cn, centsToInputValue, parsePriceToCents } from '@/lib/utils'
import type { Product } from '@/types'
import { toast } from 'sonner'

const schema = z.object({
  name:        z.string().min(2, 'Nome muito curto').max(120, 'Nome muito longo'),
  category_id: z.string().min(1, 'Selecione uma categoria'), // ← min(1) em vez de uuid()
  description: z.string().optional(),
  price:       z.string().min(1, 'Informe o preço'),
  stock:       z.coerce.number().int().min(0, 'Estoque não pode ser negativo'),
  is_active:   z.boolean(),
  is_featured: z.boolean(),
})
type FormData = z.infer<typeof schema>

interface ProductFormProps {
  product?: Product
  onClose: () => void
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const isEditing = !!product
  const { data: categoriesData, isLoading: loadingCategories } = useAdminCategories()
  const { mutate: create, isPending: creating } = useCreateProduct(onClose)
  const { mutate: update, isPending: updating } = useUpdateProduct(onClose)
  const { mutate: uploadImage, isPending: uploading } = useUploadProductImage(product?.id ?? '')
  const { mutate: deleteImage, isPending: deletingImage } = useDeleteProductImage(product?.id ?? '')
  const isPending = creating || updating
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        product?.name ?? '',
      category_id: product?.category_id ?? product?.category?.id,
      description: product?.description ?? '',
      price:       product ? centsToInputValue(product.price_in_cents) : '',
      stock:       product?.stock ?? 0,
      is_active:   product?.is_active ?? true,
      is_featured: product?.is_featured ?? false,
    },
  })

  // ← CORREÇÃO: assim que as categorias chegarem, re-seta o category_id
  // Isso resolve o problema de timing onde o select renderizava sem opções
  // e o browser resetava o valor selecionado para vazio.
  const isActive   = watch('is_active')
  const isFeatured = watch('is_featured')

    // ↓ COLOCA AQUI — depois de todos os hooks, antes do return do form
  if (isEditing && loadingCategories) {
    return (
      <div className="space-y-5 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-admin-surface rounded-lg" />
        ))}
      </div>
    )
  }

  const onSubmit = (data: FormData) => {
    const payload = {
      name:           data.name,
      category_id:    data.category_id,
      description:    data.description || undefined,
      price_in_cents: parsePriceToCents(data.price),
      stock:          data.stock,
      is_active:      data.is_active,
      is_featured:    data.is_featured,
    }
    if (isEditing) update({ id: product.id, ...payload })
    else create(payload)
  }

  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) { setValue('price', ''); return }
    const formatted = (parseInt(raw, 10) / 100).toFixed(2).replace('.', ',')
    setValue('price', formatted)
  }

  const handleFileChange = (files: FileList | null) => {
    if (!files || !product?.id) return
    Array.from(files).forEach(file => uploadImage(file))
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (formErrors) => {
        if (formErrors.category_id) {
          toast.error('Selecione uma categoria antes de salvar.')
        }
        
      })}
      className="space-y-5"
    >
      {/* Nome */}
      <div>
        <label className="input-label">Nome do produto *</label>
        <input
          type="text"
          placeholder="Ex: Bolsa de couro caramelo"
          className="input-field"
          {...register('name')}
        />
        {errors.name && <p className="input-error">{errors.name.message}</p>}
      </div>

      {/* Categoria */}
      <div>
        <label className="input-label">Categoria *</label>
        <select
          className="input-field"
          disabled={loadingCategories}
          {...register('category_id')}
        >
          <option value="">
            {loadingCategories ? 'Carregando categorias…' : 'Selecione uma categoria'}
          </option>
          {categoriesData?.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}{!cat.is_active ? ' (inativa)' : ''}
            </option>
          ))}
        </select>
        {errors.category_id && <p className="input-error">{errors.category_id.message}</p>}
      </div>

      {/* Preço + Estoque */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="input-label">Preço *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted text-sm font-body">R$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0,00"
              className="input-field pl-9"
              {...register('price')}
              onChange={handlePriceInput}
            />
          </div>
          {errors.price && <p className="input-error">{errors.price.message}</p>}
        </div>
        <div>
          <label className="input-label">Estoque *</label>
          <input
            type="number"
            min={0}
            placeholder="0"
            className="input-field"
            {...register('stock')}
          />
          {errors.stock && <p className="input-error">{errors.stock.message}</p>}
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label className="input-label">Descrição</label>
        <textarea
          rows={3}
          placeholder="Descreva o produto, materiais, medidas…"
          className="input-field resize-none"
          {...register('description')}
        />
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-3 py-1">
        <Toggle checked={isActive}   onChange={v => setValue('is_active', v)}   label="Produto ativo (visível na loja)" />
        <Toggle checked={isFeatured} onChange={v => setValue('is_featured', v)} label="Destaque na página inicial" />
      </div>

      {/* Upload de imagens — só aparece em edição */}
      {isEditing && (
        <div>
          <label className="input-label">Imagens</label>

          {product.images.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {product.images.map(img => (
                <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-admin-border">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => deleteImage(img.id)}
                    disabled={deletingImage}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    aria-label="Remover imagem"
                  >
                    <Trash2 size={16} className="text-white" />
                  </button>
                  {img.position === 0 && (
                    <span className="absolute top-1 left-1 bg-brand text-white text-[9px] font-body px-1.5 py-0.5 rounded">Capa</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFileChange(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
              dragOver
                ? 'border-brand bg-brand/5'
                : 'border-admin-border hover:border-leather-300 hover:bg-admin-surface/50',
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-admin-muted">
                <Loader2 size={20} className="animate-spin text-brand" />
                <span className="font-body text-xs">Enviando…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-admin-muted">
                <ImagePlus size={20} />
                <span className="font-body text-xs">
                  Arraste imagens ou{' '}
                  <span className="text-brand font-medium">clique para selecionar</span>
                </span>
                <span className="font-body text-[10px] text-admin-muted/60">
                  JPG, PNG, WEBP — máx 5 MB
                </span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={e => handleFileChange(e.target.files)}
          />
        </div>
      )}

      {!isEditing && (
        <p className="font-body text-xs text-admin-muted bg-admin-surface rounded-lg px-3 py-2.5">
          💡 Após criar o produto, você poderá adicionar imagens na edição.
        </p>
      )}

      {/* Ações */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={isPending} className="btn-primary flex-1">
          {isPending
            ? <><Loader2 size={14} className="animate-spin" />Salvando…</>
            : isEditing ? 'Salvar alterações' : 'Criar produto'
          }
        </button>
      </div>
    </form>
  )
}