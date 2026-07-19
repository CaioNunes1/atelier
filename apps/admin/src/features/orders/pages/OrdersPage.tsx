import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ShoppingBag, Eye, Loader2, X } from 'lucide-react'
import { PageHeader, EmptyState, LoadingRows, Modal } from '@/components/ui'
import { api } from '@/lib/axios'
import { extractErrorMessage, formatDate, formatPrice, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, cn } from '@/lib/utils'
import type { Order, OrderStatus, UpdateOrderStatusPayload } from '@/types'

// ─── API + hooks ──────────────────────────────────────────────────────────────
const orderApi = {
  listAdmin: () => api.get<{ data: Order[] }>('/api/admin/orders').then(r => r.data.data),
  getAdmin:  (id: string) => api.get<{ data: Order }>(`/api/admin/orders/${id}`).then(r => r.data.data),
  updateStatus: (id: string, p: UpdateOrderStatusPayload) =>
    api.patch<{ data: Order }>(`/api/admin/orders/${id}/status`, p).then(r => r.data.data),
}

function useAdminOrders() {
  return useQuery({ queryKey: ['admin', 'orders'], queryFn: orderApi.listAdmin })
}

function useAdminOrder(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'orders', id],
    queryFn: () => orderApi.getAdmin(id!),
    enabled: !!id,
  })
}

function useUpdateOrderStatus(onDone?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...p }: UpdateOrderStatusPayload & { id: string }) => orderApi.updateStatus(id, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
      toast.success('Status atualizado!')
      onDone?.()
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })
}

// ─── Status flow ──────────────────────────────────────────────────────────────
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID:       'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED:    'DELIVERED',
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderDetailModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { data: order, isLoading } = useAdminOrder(orderId)
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus()
  const [trackingCode, setTrackingCode] = useState('')

  if (isLoading || !order) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-brand" />
      </div>
    )
  }

  const nextStatus = NEXT_STATUS[order.status]

  const handleStatusUpdate = () => {
    if (!nextStatus) return
    updateStatus({
      id: order.id,
      status: nextStatus,
      tracking_code: nextStatus === 'SHIPPED' ? trackingCode : undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body text-xs text-admin-muted">Pedido</p>
          <p className="font-mono text-xs text-admin-ink">{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <span className={cn('status-badge', ORDER_STATUS_COLOR[order.status])}>
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>

      {/* Cliente */}
      {order.user && (
        <div className="bg-admin-surface rounded-lg px-4 py-3">
          <p className="font-body text-xs text-admin-muted mb-0.5">Cliente</p>
          <p className="font-body text-sm font-medium text-admin-ink">{order.user.name}</p>
          <p className="font-body text-xs text-admin-muted">{order.user.email}</p>
        </div>
      )}

      {/* Itens */}
      <div>
        <p className="font-body text-xs text-admin-muted uppercase tracking-wider mb-2">Itens do pedido</p>
        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-admin-border last:border-0">
              <div>
                <p className="font-body text-sm text-admin-ink">{item.product_name}</p>
                {item.variant_name && <p className="font-body text-xs text-admin-muted">{item.variant_name}</p>}
                <p className="font-body text-xs text-admin-muted">× {item.quantity}</p>
              </div>
              <p className="font-body text-sm font-medium text-admin-ink">
                {formatPrice(item.unit_price_in_cents * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Totais */}
      <div className="bg-admin-surface rounded-lg px-4 py-3 space-y-1.5">
        <div className="flex justify-between font-body text-sm text-admin-muted">
          <span>Subtotal</span><span>{formatPrice(order.subtotal_in_cents)}</span>
        </div>
        {order.discount_in_cents > 0 && (
          <div className="flex justify-between font-body text-sm text-emerald-700">
            <span>Desconto{order.coupon_code && ` (${order.coupon_code})`}</span>
            <span>− {formatPrice(order.discount_in_cents)}</span>
          </div>
        )}
        <div className="flex justify-between font-body text-sm text-admin-muted">
          <span>Frete</span><span>{formatPrice(order.shipping_in_cents)}</span>
        </div>
        <div className="flex justify-between font-body text-sm font-semibold text-admin-ink pt-1 border-t border-admin-border">
          <span>Total</span><span>{formatPrice(order.total_in_cents)}</span>
        </div>
      </div>

      {/* Endereço */}
      {order.address && (
        <div>
          <p className="font-body text-xs text-admin-muted uppercase tracking-wider mb-1">Endereço de entrega</p>
          <p className="font-body text-sm text-admin-ink">
            {order.address.street}, {order.address.number}
            {order.address.complement && ` — ${order.address.complement}`}
          </p>
          <p className="font-body text-xs text-admin-muted">
            {order.address.neighborhood}, {order.address.city}/{order.address.state} — {order.address.zip_code}
          </p>
        </div>
      )}

      {/* Rastreio */}
      {order.tracking_code && (
        <div className="bg-admin-surface rounded-lg px-4 py-3">
          <p className="font-body text-xs text-admin-muted mb-0.5">Código de rastreio</p>
          <p className="font-mono text-sm text-admin-ink">{order.tracking_code}</p>
        </div>
      )}

      {/* Ação de mudança de status */}
      {nextStatus && order.status !== 'CANCELLED' && (
        <div className="border-t border-admin-border pt-4 space-y-3">
          {nextStatus === 'SHIPPED' && (
            <div>
              <label className="input-label">Código de rastreio *</label>
              <input
                type="text"
                value={trackingCode}
                onChange={e => setTrackingCode(e.target.value)}
                placeholder="Ex: BR123456789BR"
                className="input-field"
              />
            </div>
          )}
          <button
            onClick={handleStatusUpdate}
            disabled={isPending || (nextStatus === 'SHIPPED' && !trackingCode)}
            className="btn-primary w-full"
          >
            {isPending
              ? <><Loader2 size={14} className="animate-spin" />Atualizando…</>
              : `Marcar como ${ORDER_STATUS_LABEL[nextStatus]}`
            }
          </button>
        </div>
      )}

      <button onClick={onClose} className="btn-secondary w-full">Fechar</button>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function OrdersPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const { data: orders, isLoading } = useAdminOrders()

  const filtered = statusFilter
    ? orders?.filter(o => o.status === statusFilter)
    : orders

  return (
    <>
      <PageHeader
        title="Pedidos"
        subtitle="Acompanhe e gerencie os pedidos da loja"
      />

      {/* Filtro de status */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['', 'PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg font-body text-xs transition-colors',
              statusFilter === s
                ? 'bg-admin-ink text-white'
                : 'bg-white border border-admin-border text-admin-muted hover:border-leather-300',
            )}
          >
            {s === '' ? 'Todos' : ORDER_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-admin-surface/40">
                {['Pedido', 'Cliente', 'Data', 'Total', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-body font-medium text-admin-muted text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <LoadingRows cols={6} rows={6} /> : !filtered?.length ? (
                <tr><td colSpan={6}>
                  <EmptyState icon={<ShoppingBag size={22} />}
                    title="Nenhum pedido encontrado"
                    description="Os pedidos da loja aparecerão aqui." />
                </td></tr>
              ) : filtered.map(order => (
                <tr key={order.id} className="border-b border-admin-border last:border-0 table-row-hover">
                  <td className="px-4 py-3.5 font-mono text-xs text-admin-muted">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3.5 font-body text-admin-ink">
                    {order.user?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3.5 font-body text-admin-muted text-xs whitespace-nowrap">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-4 py-3.5 font-body font-medium text-admin-ink whitespace-nowrap">
                    {formatPrice(order.total_in_cents)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn('status-badge', ORDER_STATUS_COLOR[order.status])}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button onClick={() => setSelectedId(order.id)} className="btn-ghost py-1.5 px-2">
                      <Eye size={13} /> Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!selectedId} onClose={() => setSelectedId(null)} title="Detalhes do pedido" maxWidth="max-w-lg">
        {selectedId && (
          <div className="max-h-[75vh] overflow-y-auto pr-1">
            <OrderDetailModal orderId={selectedId} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </Modal>
    </>
  )
}
