import type { Product } from '@/features/catalog/types';

export interface Favorite {
  id: string;
  product_id: string;
  product: Product;
  created_at: string;
}
