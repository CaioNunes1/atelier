export interface CartProductCategorySnapshot {
  id: string;
  name: string;
  slug: string;
}

export interface CartProductImageSnapshot {
  id: string;
  url: string;
  position: number;
}

export interface CartProductSnapshot {
  id: string;
  name: string;
  slug: string;
  price_in_cents: number;
  stock: number;
  is_active: boolean;
  image: CartProductImageSnapshot | null;
  category: CartProductCategorySnapshot;
}

export interface CartVariantSnapshot {
  id: string;
  name: string;
  stock: number;
  price_modifier_in_cents: number | null;
}

export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price_in_cents: number;
  line_total_in_cents: number;
  stock: number;
  product: CartProductSnapshot;
  variant: CartVariantSnapshot | null;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total_items: number;
  subtotal_in_cents: number;
}

export interface CartItemInput {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  product?: CartProductSnapshot;
  variant?: CartVariantSnapshot | null;
}
