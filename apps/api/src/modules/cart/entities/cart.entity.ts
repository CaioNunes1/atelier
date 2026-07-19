export interface CartProductImageEntity {
  id: string;
  url: string;
  position: number;
}

export interface CartProductCategoryEntity {
  id: string;
  name: string;
  slug: string;
}

export interface CartProductEntity {
  id: string;
  name: string;
  slug: string;
  price_in_cents: number;
  stock: number;
  is_active: boolean;
  image: CartProductImageEntity | null;
  category: CartProductCategoryEntity;
}

export interface CartVariantEntity {
  id: string;
  name: string;
  stock: number;
  price_modifier_in_cents: number | null;
}

export interface CartItemEntity {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price_in_cents: number;
  line_total_in_cents: number;
  stock: number;
  product: CartProductEntity;
  variant: CartVariantEntity | null;
}

export interface CartEntity {
  id: string;
  items: CartItemEntity[];
  total_items: number;
  subtotal_in_cents: number;
}
