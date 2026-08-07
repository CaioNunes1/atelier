import { useMutation, useQuery } from '@tanstack/react-query';
import {api} from '@/lib/axios';
import type { CouponValidationResult, Order, OrderStatus, ShippingQuote } from '../types';
import { publicApi } from '@/lib/publicAxios';

export function useValidateCoupon() {
  return useMutation({
    mutationFn: async (input: { code: string; subtotal_in_cents: number }) => {
      const response = await api.post<{ data: CouponValidationResult }>('/api/coupons/validate', input);
      return response.data.data;
    },
  });
}

export function useShippingQuote() {
  return useMutation({
    mutationFn: async (input: { zip_code: string; subtotal_in_cents: number }) => {
      const response = await api.post<{ data: ShippingQuote }>('/api/shipping/calculate', input)
      return response.data.data
    },
  })
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (input: { address_id: string; coupon_code?: string }) => {
      const response = await api.post<{ data: Order }>('/api/orders', input);
      return response.data.data;
    },
  });
}

export function useCheckoutPayment() {
  return useMutation({
    mutationFn: async (input: { order_id: string }) => {
      const response = await api.post<{ data: { url: string } }>('/api/payments/checkout', input);
      return response.data.data;
    },
  });
}

export function useOrders(enabled = true) {
  return useQuery({
    queryKey: ['orders'],
    enabled,
    queryFn: async () => {
      const response = await api.get<{ data: Order[] }>('/api/orders');
      return response.data.data;
    },
  });
}

export function useOrder(id: string, enabled = true) {
  return useQuery({
    queryKey: ['orders', id],
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const response = await api.get<{ data: Order }>(`/api/orders/${id}`);
      return response.data.data;
    },
  });
}

export function usePublicOrderStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: ['public-order-status', id],
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const response = await publicApi.get<{ data: { status: OrderStatus } }>(
        `/api/orders/public/${id}`,
      );
      return response.data.data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (
        status === 'PAID' ||
        status === 'PROCESSING' ||
        status === 'SHIPPED' ||
        status === 'DELIVERED' ||
        status === 'CANCELLED'
      ) {
        return false;
      }
      return 3000;
    },
  });
}