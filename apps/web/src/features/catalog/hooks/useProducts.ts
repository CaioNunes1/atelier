import { useQuery } from '@tanstack/react-query';
import {api} from '@/lib/axios';
import type { PaginatedProducts, ProductsFilters } from '../types';

export function useProducts(filters: ProductsFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const response = await api.get<PaginatedProducts>('/api/products', { params: filters });
      return response.data;
    },
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const response = await api.get<{ data: PaginatedProducts['data'] }>('/api/products/featured');
      return response.data.data;
    },
  });
}
