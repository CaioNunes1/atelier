import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { extractErrorMessage } from '@/lib/utils'
import type { Coupon, CreateCouponPayload, UpdateCouponPayload } from '@/types'

// ─── API ─────────────────────────────────────────────────────────────────────
const couponApi = {
  listAll: () =>
    api.get<{ data: Coupon[] }>('/api/admin/coupons').then(r => r.data.data),
  create: (p: CreateCouponPayload) =>
    api.post<{ data: Coupon }>('/api/admin/coupons', p).then(r => r.data.data),
  update: (id: string, p: UpdateCouponPayload) =>
    api.patch<{ data: Coupon }>(`/api/admin/coupons/${id}`, p).then(r => r.data.data),
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
export function useAdminCoupons() {
  return useQuery({ queryKey: ['admin', 'coupons'], queryFn: couponApi.listAll })
}

export function useCreateCoupon(onDone?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: couponApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }); toast.success('Cupom criado!'); onDone?.() },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })
}

export function useUpdateCoupon(onDone?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...p }: UpdateCouponPayload & { id: string }) => couponApi.update(id, p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }); toast.success('Cupom atualizado!'); onDone?.() },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })
}
