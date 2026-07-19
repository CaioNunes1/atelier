import { OrderStatus } from '@prisma/client';

export interface OrderItemEntity {
  id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  unit_price_in_cents: number;
  quantity: number;
}

export interface OrderAddressEntity {
  id: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

export interface OrderEntity {
  id: string;
  status: OrderStatus;
  subtotal_in_cents: number;
  discount_in_cents: number;
  shipping_in_cents: number;
  total_in_cents: number;
  coupon_code: string | null;
  tracking_code: string | null;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
  items: OrderItemEntity[];
  address: OrderAddressEntity | null;
}
