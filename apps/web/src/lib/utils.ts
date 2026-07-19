export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

export function extractErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error
  ) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response
    const message = response?.data?.message
    if (Array.isArray(message)) return message[0]
    if (typeof message === 'string') return message
  }
  return 'Algo deu errado. Tente novamente.'
}
