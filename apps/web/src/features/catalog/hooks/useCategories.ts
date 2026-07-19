import { useQuery } from '@tanstack/react-query';
import {api} from '@/lib/axios';
import type { Category } from '../types';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<{ data: Category[] }>('/api/categories');
      return response.data.data;
    },
  });
}
