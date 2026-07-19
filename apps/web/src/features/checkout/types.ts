export interface Address {
  id: string;
  label: string | null;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingQuote {
  shipping_in_cents: number;
  estimated_days: number;
}

export interface CouponValidationResult {
  valid: true;
  discount_in_cents: number;
  final_price_in_cents: number;
}

export interface OrderItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  unit_price_in_cents: number;
  quantity: number;
}

export interface OrderAddress {
  id: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  status: OrderStatus;
  subtotal_in_cents: number;
  discount_in_cents: number;
  shipping_in_cents: number;
  total_in_cents: number;
  coupon_code: string | null;
  tracking_code: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  address: OrderAddress | null;
}
