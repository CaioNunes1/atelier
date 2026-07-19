import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

// ─── Modal ───────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-admin-md w-full animate-slide-in', maxWidth)}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-admin-border">
          <h2 className="font-display text-xl text-admin-ink">{title}</h2>
          <button onClick={onClose}
            className="p-1.5 text-admin-muted hover:text-admin-ink hover:bg-admin-surface rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={cn('flex items-center gap-2.5 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn('toggle', checked ? 'bg-brand' : 'bg-admin-border')}
      >
        <span className={cn('toggle-thumb', checked ? 'translate-x-4' : 'translate-x-0')} />
      </button>
      {label && <span className="font-body text-sm text-admin-ink">{label}</span>}
    </label>
  )
}

// ─── PageHeader ──────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="font-display text-display-sm text-admin-ink leading-tight">{title}</h1>
        {subtitle && <p className="font-body text-sm text-admin-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  )
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-admin-surface flex items-center justify-center text-admin-muted mb-4">
        {icon}
      </div>
      <h3 className="font-display text-xl text-admin-ink mb-1">{title}</h3>
      <p className="font-body text-sm text-admin-muted max-w-xs">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ─── LoadingRows (tabela skeleton) ───────────────────────────────────────────
export function LoadingRows({ cols = 4, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-admin-border">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-4 py-3.5">
              <div className="h-4 bg-admin-surface rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
export function StatusBadge({ active, activeLabel = 'Ativo', inactiveLabel = 'Inativo' }: {
  active: boolean; activeLabel?: string; inactiveLabel?: string
}) {
  return (
    <span className={cn('status-badge', active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-600')}>
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', active ? 'bg-emerald-500' : 'bg-red-400')} />
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}
