export interface ProductImageEntity {
  id: string;
  url: string;
  position: number;
}

export interface ProductVariantEntity {
  id: string;
  name: string;
  stock: number;
  price_modifier_in_cents: number | null;
  is_available: boolean;
}

export interface ProductCategoryEntity {
  id: string;
  name: string;
  slug: string;
}

export interface ProductEntity {
  id: string;
  category: ProductCategoryEntity;
  name: string;
  slug: string;
  description: string | null;
  price_in_cents: number;
  is_active: boolean;
  is_featured: boolean;
  stock: number;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
  images: ProductImageEntity[];
  variants: ProductVariantEntity[];
}
