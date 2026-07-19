import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(iso))
}

/** Converte "R$ 189,90" → 18990 */
export function parsePriceToCents(formatted: string): number {
  const clean = formatted.replace(/[R$\s.]/g, '').replace(',', '.')
  return Math.round(parseFloat(clean) * 100)
}

/** Converte 18990 → "189,90" para exibir em input */
export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

export function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const msg = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
    if (Array.isArray(msg)) return msg[0]
    if (typeof msg === 'string') return msg
  }
  return 'Algo deu errado. Tente novamente.'
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAID:            'Pago',
  PROCESSING:      'Em preparo',
  SHIPPED:         'Enviado',
  DELIVERED:       'Entregue',
  CANCELLED:       'Cancelado',
}

export const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-800',
  PAID:            'bg-blue-100 text-blue-800',
  PROCESSING:      'bg-violet-100 text-violet-800',
  SHIPPED:         'bg-indigo-100 text-indigo-800',
  DELIVERED:       'bg-emerald-100 text-emerald-800',
  CANCELLED:       'bg-red-100 text-red-800',
}
