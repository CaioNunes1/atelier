import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { Address } from '../types';

export interface AddressInput {
  label?: string;
  zip_code: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  is_default?: boolean;
}

export function useAddresses(enabled: boolean) {
  return useQuery({
    queryKey: ['addresses'],
    enabled,
    queryFn: async () => {
      const response = await api.get<{ data: Address[] }>('/api/me/addresses');
      return response.data.data;
    },
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddressInput) => {
      const response = await api.post<{ data: Address }>('/api/me/addresses', input);
      return response.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}
