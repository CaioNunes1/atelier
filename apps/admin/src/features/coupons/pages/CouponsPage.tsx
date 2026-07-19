import { useState } from 'react'
import { Plus, Ticket, Pencil, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader, Modal, EmptyState, LoadingRows, StatusBadge, Toggle } from '@/components/ui'
import { useAdminCoupons, useCreateCoupon, useUpdateCoupon } from '../hooks/useCoupons'
import { formatDate, formatPrice, cn } from '@/lib/utils'
import type { Coupon, CouponType } from '@/types'

const schema = z.object({
  code:       z.string().min(3, 'Código muito curto').max(40),
  type:       z.enum(['PERCENTAGE', 'FIXED_AMOUNT'] as const),
  value:      z.coerce.number().min(1, 'Valor deve ser maior que 0'),
  max_uses:   z.coerce.number().int().min(1).optional().or(z.literal('')),
  valid_until: z.string().optional().or(z.literal('')),
  is_active:  z.boolean(),
})
type FormData = z.infer<typeof schema>

function CouponForm({ coupon, onClose }: { coupon?: Coupon; onClose: () => void }) {
  const isEditing = !!coupon
  const { mutate: create, isPending: creating } = useCreateCoupon(onClose)
  const { mutate: update, isPending: updating } = useUpdateCoupon(onClose)
  const isPending = creating || updating

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      code:        coupon?.code ?? '',
      type:        coupon?.type ?? 'PERCENTAGE',
      value:       coupon?.value ?? 10,
      max_uses:    coupon?.max_uses ?? '',
      valid_until: coupon?.valid_until ? coupon.valid_until.slice(0, 10) : '',
      is_active:   coupon?.is_active ?? true,
    },
  })

  const type     = watch('type') as CouponType
  const isActive = watch('is_active')

  const onSubmit = (data: FormData) => {
    const payload = {
      code:        data.code.toUpperCase(),
      type:        data.type,
      value:       Number(data.value),
      max_uses:    data.max_uses ? Number(data.max_uses) : undefined,
      valid_until: data.valid_until || undefined,
      is_active:   data.is_active,
    }
    if (isEditing) update({ id: coupon.id, ...payload })
    else create(payload)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Código */}
      <div>
        <label className="input-label">Código do cupom *</label>
        <input
          type="text"
          placeholder="BEMVINDA10"
          className="input-field uppercase"
          {...register('code')}
          onChange={e => { e.target.value = e.target.value.toUpperCase(); register('code').onChange(e) }}
        />
        {errors.code && <p className="input-error">{errors.code.message}</p>}
      </div>

      {/* Tipo + Valor */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="input-label">Tipo *</label>
          <select className="input-field" {...register('type')}>
            <option value="PERCENTAGE">Percentual (%)</option>
            <option value="FIXED_AMOUNT">Valor fixo (R$)</option>
          </select>
        </div>
        <div>
          <label className="input-label">
            {type === 'PERCENTAGE' ? 'Desconto (%) *' : 'Desconto (R$) *'}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted text-sm">
              {type === 'PERCENTAGE' ? '%' : 'R$'}
            </span>
            <input type="number" min={1} max={type === 'PERCENTAGE' ? 100 : undefined}
              placeholder={type === 'PERCENTAGE' ? '10' : '0,00'}
              className="input-field pl-9" {...register('value')} />
          </div>
          {errors.value && <p className="input-error">{errors.value.message}</p>}
        </div>
      </div>

      {/* Máx usos + Validade */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="input-label">Máx. de usos</label>
          <input type="number" min={1} placeholder="Ilimitado" className="input-field" {...register('max_uses')} />
        </div>
        <div>
          <label className="input-label">Válido até</label>
          <input type="date" className="input-field" {...register('valid_until')} />
        </div>
      </div>

      <Toggle checked={isActive} onChange={v => setValue('is_active', v)} label="Cupom ativo" />

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" disabled={isPending} className="btn-primary flex-1">
          {isPending ? <><Loader2 size={14} className="animate-spin" />Salvando…</> : isEditing ? 'Salvar' : 'Criar cupom'}
        </button>
      </div>
    </form>
  )
}

export function CouponsPage() {
  const [modal, setModal] = useState<'create' | Coupon | null>(null)
  const { data: coupons, isLoading } = useAdminCoupons()

  return (
    <>
      <PageHeader
        title="Cupons"
        subtitle="Gerencie descontos e promoções"
        action={
          <button onClick={() => setModal('create')} className="btn-primary">
            <Plus size={15} /> Novo cupom
          </button>
        }
      />

      <div className="admin-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-admin-border bg-admin-surface/40">
              {['Código', 'Tipo', 'Desconto', 'Usos', 'Validade', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 font-body font-medium text-admin-muted text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? <LoadingRows cols={7} rows={4} /> : !coupons?.length ? (
              <tr><td colSpan={7}>
                <EmptyState icon={<Ticket size={22} />} title="Nenhum cupom criado"
                  description="Crie cupons de desconto para suas clientes."
                  action={<button onClick={() => setModal('create')} className="btn-primary"><Plus size={14} />Criar cupom</button>} />
              </td></tr>
            ) : coupons.map(coupon => {
              const expired = coupon.valid_until ? new Date(coupon.valid_until) < new Date() : false
              const exhausted = coupon.max_uses !== null && coupon.used_count >= coupon.max_uses
              return (
                <tr key={coupon.id} className="border-b border-admin-border last:border-0 table-row-hover">
                  <td className="px-4 py-3.5">
                    <code className="font-mono text-sm bg-admin-surface px-2 py-0.5 rounded text-admin-ink">{coupon.code}</code>
                  </td>
                  <td className="px-4 py-3.5 font-body text-admin-muted text-xs">
                    {coupon.type === 'PERCENTAGE' ? 'Percentual' : 'Valor fixo'}
                  </td>
                  <td className="px-4 py-3.5 font-body font-medium text-admin-ink">
                    {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : formatPrice(coupon.value)}
                  </td>
                  <td className="px-4 py-3.5 font-body text-admin-muted text-xs">
                    {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}
                    {exhausted && <span className="ml-1.5 text-red-500">(esgotado)</span>}
                  </td>
                  <td className="px-4 py-3.5 font-body text-admin-muted text-xs">
                    {coupon.valid_until ? (
                      <span className={cn(expired && 'text-red-500')}>
                        {formatDate(coupon.valid_until).split(',')[0]}
                        {expired && ' (expirado)'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge active={coupon.is_active && !expired && !exhausted} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button onClick={() => setModal(coupon)} className="btn-ghost py-1.5 px-2">
                      <Pencil size={13} /> Editar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modal !== null} onClose={() => setModal(null)}
        title={modal === 'create' ? 'Novo cupom' : 'Editar cupom'}>
        <CouponForm
          coupon={modal !== 'create' && modal !== null ? modal : undefined}
          onClose={() => setModal(null)}
        />
      </Modal>
    </>
  )
}
