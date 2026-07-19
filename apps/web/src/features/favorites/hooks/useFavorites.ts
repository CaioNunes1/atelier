import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {api} from '@/lib/axios';
import { useIsAuthenticated } from '@/features/auth/hooks/useAuthMutations';
import type { Product } from '@/features/catalog/types';
import type { Favorite } from '../types';

export function useFavorites() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ['favorites'],
    enabled: authenticated,
    queryFn: async () => {
      const response = await api.get<{ data: Favorite[] }>('/api/me/favorites');
      return response.data.data;
    },
  });
}

export function useFavoriteStatus(productId: string) {
  const { data: favorites = [] } = useFavorites();
  return favorites.some((favorite) => favorite.product.id === productId);
}

export function useToggleFavorite(product: Product) {
  const navigate = useNavigate();
  const authenticated = useIsAuthenticated();
  const queryClient = useQueryClient();
  const favoritesQuery = useFavorites();
  const isFavorited = favoritesQuery.data?.some((favorite) => favorite.product.id === product.id) ?? false;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!authenticated) {
        navigate('/login');
        return null;
      }

      if (isFavorited) {
        const response = await api.delete<{ data: { success: boolean } }>(`/api/me/favorites/${product.id}`);
        return response.data.data;
      }

      const response = await api.post<{ data: Favorite }>(`/api/me/favorites/${product.id}`);
      return response.data.data;
    },
    onMutate: async () => {
      if (!authenticated) {
        return { previous: [] as Favorite[] };
      }

      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      const previous = queryClient.getQueryData<Favorite[]>(['favorites']) ?? [];
      const next = isFavorited
        ? previous.filter((favorite) => favorite.product.id !== product.id)
        : [
            ...previous,
            {
              id: `optimistic-${product.id}`,
              product_id: product.id,
              product,
              created_at: new Date().toISOString(),
            },
          ];
      queryClient.setQueryData(['favorites'], next);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['favorites'], context.previous);
      }
    },
    onSettled: async () => {
      if (authenticated) {
        await queryClient.invalidateQueries({ queryKey: ['favorites'] });
      }
    },
  });

  return {
    ...mutation,
    isFavorited,
  };
}
