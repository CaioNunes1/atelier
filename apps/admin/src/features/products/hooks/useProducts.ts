import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { extractErrorMessage } from '@/lib/utils'
import type {
  Product, CreateProductPayload, UpdateProductPayload,
  ProductFilters, PaginatedResponse,
} from '@/types'

// ─── API ─────────────────────────────────────────────────────────────────────
export const productApi = {
  listAdmin: (filters: ProductFilters = {}) =>
    api.get<PaginatedResponse<Product>>('/api/admin/products', { params: filters })
       .then(r => r.data),

  create: (payload: CreateProductPayload) =>
    api.post<{ data: Product }>('/api/admin/products', payload).then(r => r.data.data),

  update: (id: string, payload: UpdateProductPayload) =>
    api.patch<{ data: Product }>(`/api/admin/products/${id}`, payload).then(r => r.data.data),

  softDelete: (id: string) =>
    api.delete(`/api/admin/products/${id}`).then(r => r.data),

  uploadImage: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ data: { id: string; url: string; position: number } }>(
      `/api/admin/products/${id}/images`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ).then(r => r.data.data)
  },

  deleteImage: (productId: string, imageId: string) =>
    api.delete(`/api/admin/products/${productId}/images/${imageId}`).then(r => r.data),
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
export function useAdminProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'products', filters],
    queryFn: () => productApi.listAdmin(filters),
  })
}

export function useCreateProduct(onDone?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      toast.success('Produto criado!')
      onDone?.()
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })
}

export function useUpdateProduct(onDone?: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateProductPayload & { id: string }) =>
      productApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      toast.success('Produto atualizado!')
      onDone?.()
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productApi.softDelete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      toast.success('Produto desativado.')
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })
}

export function useUploadProductImage(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => productApi.uploadImage(productId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      toast.success('Imagem enviada!')
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })
}

export function useDeleteProductImage(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (imageId: string) => productApi.deleteImage(productId, imageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      toast.success('Imagem removida.')
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  })
}
