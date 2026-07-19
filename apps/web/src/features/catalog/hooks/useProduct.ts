import { useQuery } from '@tanstack/react-query';
import {api} from '@/lib/axios';
import type { Product } from '../types';

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const response = await api.get<{ data: Product }>(`/api/products/${slug}`);
      return response.data.data;
    },
  });
}
