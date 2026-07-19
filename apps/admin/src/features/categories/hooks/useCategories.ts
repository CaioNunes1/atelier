import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { extractErrorMessage } from '@/lib/utils'
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from '@/types'

// ─── API ─────────────────────────────────────────────────────────────────────
const categoryApi = {
  listAll: () =>
    api.get<{ data: Category[] }>('/api/admin/categories').then(r => r.data.data),

  create: (payload: CreateCategoryPayload) =>
    api.post<{ data: Category }>('/api/admin/categories', payload).then(r => r.data.data),

  update: (id: string, payload: UpdateCategoryPayload) =>
    api.patch<{ data: Category }>(`/api/admin/categories/${id}`, payload).then(r => r.data.data),
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: categoryApi.listAll,
  })
}

export function useCreateCategory(onDone?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      toast.success('Categoria criada!')
      onDone?.()
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })
}

export function useUpdateCategory(onDone?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCategoryPayload & { id: string }) =>
      categoryApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      toast.success('Categoria atualizada!')
      onDone?.()
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })
}
