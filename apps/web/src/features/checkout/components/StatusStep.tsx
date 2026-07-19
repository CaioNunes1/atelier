import { cn } from '@/lib/utils';
import type { OrderStatus } from '../types';

type StatusStepProps = {
  status: OrderStatus;
  current: boolean;
  label: string;
};

export function StatusStep({ status, current, label }: StatusStepProps) {
  return (
    <div className={cn('rounded-2xl border px-4 py-3 text-sm', current ? 'border-roseartisan-500 bg-roseartisan-50' : 'border-roseartisan-200')}>
      <div className="flex items-center justify-between gap-3">
        <strong className="text-stone-900">{label}</strong>
        <span className="text-xs uppercase tracking-[0.2em] text-stone-500">{status}</span>
      </div>
    </div>
  );
}
