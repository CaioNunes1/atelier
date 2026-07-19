import { useCallback, useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import { queryClient } from '@/lib/queryClient'
import { useCartStore } from '../store/cartStore'
import type { Cart, CartItem, CartItemInput } from '../types'
import { useAuth } from '@/features/auth/AuthContext'
import { toast } from 'sonner'

export function useCart() {
  const { isAuthenticated } = useAuth() // ← só isso, sem chamar useAuth() duas vezes

  const localItems = useCartStore((state) => state.items)
  const addLocalItem = useCartStore((state) => state.addItem)
  const removeLocalItem = useCartStore((state) => state.removeItem)
  const updateLocalQuantity = useCartStore((state) => state.updateQuantity)
  const clearLocalCart = useCartStore((state) => state.clearCart)
  const mergeLocalWithServer = useCartStore((state) => state.mergeWithServer)

  const cartQuery = useQuery({
    queryKey: ['cart'],
    enabled: isAuthenticated, // ← reativo: assim que isAuthenticated virar true, dispara
    queryFn: async () => {
      const response = await api.get<{ data: Cart }>('/api/cart')
      return response.data.data
    },
  })

  const addMutation = useMutation({
    mutationFn: async (item: CartItemInput) => {
      // Envia só o que o backend aceita — sem os snapshots de produto/variante
      const response = await api.post<{ data: Cart }>('/api/cart/items', {
        product_id: item.product_id,
        variant_id: item.variant_id ?? undefined,
        quantity: item.quantity,
      })
      return response.data.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Produto adicionado ao carrinho!')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (params: { itemId: string; quantity: number }) => {
      const response = await api.patch<{ data: Cart }>(
        `/api/cart/items/${params.itemId}`,
        { quantity: params.quantity },
      )
      return response.data.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await api.delete<{ data: Cart }>(`/api/cart/items/${itemId}`)
      return response.data.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Produto removido do carrinho!')
    },
  })

  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete<{ data: Cart }>('/api/cart')
      return response.data.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  const mergeMutation = useMutation({
    mutationFn: async (items: CartItemInput[]) => {
      // Envia só o que o backend aceita — mesmo padrão do addMutation
      const response = await api.post<{ data: Cart }>('/api/cart/merge', {
        items: items.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id ?? undefined,
          quantity:   item.quantity,
        })),
      })
      return response.data.data
    },
    onSuccess: async () => {
      mergeLocalWithServer([])
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  const guestCart = useMemo<Cart>(
    () => ({
      id: 'guest-cart',
      items: localItems,
      total_items: localItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal_in_cents: localItems.reduce(
        (sum, item) => sum + item.line_total_in_cents,
        0,
      ),
    }),
    [localItems],
  )

  const cart = isAuthenticated ? (cartQuery.data ?? guestCart) : guestCart

  const addItem = useCallback(
    (item: CartItemInput) => {
      if (isAuthenticated) {
        addMutation.mutate(item)
        return
      }
      if (!item.product) {
      toast.error('Não foi possível adicionar o produto.')
      return
    }

      addLocalItem(item)
      toast.success('Produto adicionado ao carrinho!')
    },
    [isAuthenticated, addLocalItem, addMutation],
  )

  const removeItem = useCallback(
    (item: CartItem) => {
      if (isAuthenticated) {
        removeMutation.mutate(item.id)
        return
      }
      toast.success('Produto removido do carrinho!')
      removeLocalItem(item.product_id, item.variant_id)
      
    },
    [isAuthenticated, removeLocalItem, removeMutation],
  )

  const updateQuantity = useCallback(
    (item: CartItem, quantity: number) => {
      if (isAuthenticated) {
        updateMutation.mutate({ itemId: item.id, quantity })
        return
      }
      updateLocalQuantity(item.product_id, item.variant_id, quantity)
    },
    [isAuthenticated, updateLocalQuantity, updateMutation],
  )

  const clearCart = useCallback(() => {
    if (isAuthenticated) {
      clearMutation.mutate()
      return
    }
    clearLocalCart()
  }, [isAuthenticated, clearLocalCart, clearMutation])

  const mergeGuestCart = useCallback(() => {
    if (isAuthenticated && localItems.length > 0) {
      mergeMutation.mutate(localItems)
    }
  }, [isAuthenticated, localItems, mergeMutation])

  return useMemo(
    () => ({
      isAuthenticated,
      cart,
      isLoading: isAuthenticated ? cartQuery.isLoading : false,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      mergeGuestCart,
    }),
    [
      isAuthenticated,
      cart,
      cartQuery.isLoading,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      mergeGuestCart,
    ],
  )
}