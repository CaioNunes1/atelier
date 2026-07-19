export interface FavoriteProductImageEntity {
  id: string;
  url: string;
  position: number;
}

export interface FavoriteProductCategoryEntity {
  id: string;
  name: string;
  slug: string;
}

export interface FavoriteProductEntity {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_in_cents: number;
  is_active: boolean;
  is_featured: boolean;
  stock: number;
  is_available: boolean;
  category: FavoriteProductCategoryEntity;
  images: FavoriteProductImageEntity[];
}

export interface FavoriteEntity {
  id: string;
  product_id: string;
  product: FavoriteProductEntity;
  created_at: Date;
}
