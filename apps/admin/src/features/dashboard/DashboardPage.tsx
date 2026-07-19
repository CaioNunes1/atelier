import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, Package, Tag, TrendingUp, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/axios'
import { formatPrice, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, cn } from '@/lib/utils'
import { LoadingRows } from '@/components/ui'
import type { Order, Product } from '@/types'
import { useAuth } from '@/features/auth/AuthContext'

function useRecentOrders() {
  return useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: () => api.get<{ data: Order[] }>('/api/admin/orders').then(r => r.data.data),
  })
}

function useLowStockProducts() {
  return useQuery({
    queryKey: ['admin', 'products', { per_page: 100 }],
    queryFn: () => api.get<{ data: Product[] }>('/api/admin/products').then(r => r.data.data),
    select: (data) => (data as unknown as { data: Product[] }).data?.filter(p => p.stock <= 5 && p.is_active) ?? [],
  })
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  sub?: string
  accent?: boolean
}

function StatCard({ label, value, icon, sub, accent }: StatCardProps) {
  return (
    <div className={cn('admin-card p-5', accent && 'bg-admin-ink border-admin-ink')}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center',
          accent ? 'bg-white/10 text-white' : 'bg-admin-surface text-admin-muted')}>
          {icon}
        </div>
      </div>
      <p className={cn('font-display text-3xl leading-none', accent ? 'text-white' : 'text-admin-ink')}>{value}</p>
      <p className={cn('font-body text-xs mt-1.5', accent ? 'text-white/60' : 'text-admin-muted')}>{label}</p>
      {sub && <p className={cn('font-body text-xs mt-0.5', accent ? 'text-brand' : 'text-brand')}>{sub}</p>}
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data: orders, isLoading: ordersLoading } = useRecentOrders()
  const { data: lowStock } = useLowStockProducts()

  const pendingOrders  = orders?.filter(o => o.status === 'PENDING_PAYMENT').length ?? 0
  const paidOrders     = orders?.filter(o => ['PAID','PROCESSING','SHIPPED'].includes(o.status)).length ?? 0
  const totalRevenue   = orders?.filter(o => o.status !== 'CANCELLED' && o.status !== 'PENDING_PAYMENT')
                               .reduce((s, o) => s + o.total_in_cents, 0) ?? 0
  const recentOrders   = [...(orders ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Saudação */}
      <div>
        <h1 className="font-display text-display-sm text-admin-ink">
          Olá, {user?.name.split(' ')[0]} 👋
        </h1>
        <p className="font-body text-sm text-admin-muted mt-0.5">
          Aqui está um resumo da sua loja hoje.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Receita total"
          value={formatPrice(totalRevenue)}
          icon={<TrendingUp size={17} />}
          accent
        />
        <StatCard
          label="Pedidos em aberto"
          value={paidOrders}
          icon={<ShoppingBag size={17} />}
          sub={paidOrders > 0 ? `${paidOrders} precisam de atenção` : undefined}
        />
        <StatCard
          label="Aguardando pagamento"
          value={pendingOrders}
          icon={<Tag size={17} />}
        />
        <StatCard
          label="Estoque baixo"
          value={lowStock?.length ?? 0}
          icon={<AlertTriangle size={17} />}
          sub={lowStock?.length ? 'Produtos com ≤ 5 unidades' : undefined}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pedidos recentes */}
        <div className="lg:col-span-2 admin-card overflow-hidden">
          <div className="px-5 py-4 border-b border-admin-border">
            <h2 className="font-display text-lg text-admin-ink">Pedidos recentes</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-admin-surface/30">
                {['Pedido', 'Cliente', 'Total', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 font-body text-xs font-medium text-admin-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordersLoading ? <LoadingRows cols={4} rows={5} /> : !recentOrders.length ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center font-body text-sm text-admin-muted">Nenhum pedido ainda</td></tr>
              ) : recentOrders.map(o => (
                <tr key={o.id} className="border-b border-admin-border last:border-0 hover:bg-admin-surface/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-admin-muted">#{o.id.slice(0,8).toUpperCase()}</td>
                  <td className="px-4 py-3 font-body text-sm text-admin-ink">{o.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-body text-sm font-medium text-admin-ink">{formatPrice(o.total_in_cents)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('status-badge', ORDER_STATUS_COLOR[o.status])}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Estoque baixo */}
        <div className="admin-card overflow-hidden">
          <div className="px-5 py-4 border-b border-admin-border">
            <h2 className="font-display text-lg text-admin-ink">Estoque baixo</h2>
          </div>
          <div className="divide-y divide-admin-border">
            {!lowStock?.length ? (
              <p className="px-5 py-8 text-center font-body text-sm text-admin-muted">Tudo em ordem ✓</p>
            ) : lowStock.map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-body text-sm text-admin-ink truncate">{p.name}</p>
                </div>
                <span className={cn(
                  'ml-3 shrink-0 font-body text-xs font-medium px-2 py-0.5 rounded',
                  p.stock === 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700',
                )}>
                  {p.stock} un.
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
