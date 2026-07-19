export interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  stock: number;
  price_modifier_in_cents: number | null;
  is_available: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  category: ProductCategory;
  name: string;
  slug: string;
  description: string | null;
  price_in_cents: number;
  is_active: boolean;
  is_featured: boolean;
  stock: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
  variants: ProductVariant[];
}

export type ProductSort = 'price' | 'name' | 'created_at';
export type ProductOrder = 'asc' | 'desc';

export interface ProductsFilters {
  category?: string;
  min_price?: number;
  max_price?: number;
  sort?: ProductSort;
  order?: ProductOrder;
  featured?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedProducts {
  data: Product[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}
