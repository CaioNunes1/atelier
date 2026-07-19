// ─── Auth ────────────────────────────────────────────────────────────────────
export type UserRole = 'CUSTOMER' | 'ADMIN'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  slug: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateCategoryPayload {
  name: string
  is_active?: boolean
}

export interface UpdateCategoryPayload {
  name?: string
  is_active?: boolean
}

// ─── Product ─────────────────────────────────────────────────────────────────
export interface ProductImage {
  id: string
  url: string
  position: number
}

export interface ProductVariant {
  id: string
  name: string
  stock: number
  price_modifier_in_cents: number
}

export interface Product {
  id: string
  category_id: string
  category?: Category
  name: string
  slug: string
  description?: string
  price_in_cents: number
  is_active: boolean
  is_featured: boolean
  stock: number
  deleted_at: string | null
  created_at: string
  updated_at: string
  images: ProductImage[]
}

export interface CreateProductPayload {
  category_id: string
  name: string
  description?: string
  price_in_cents: number
  is_active?: boolean
  is_featured?: boolean
  stock: number
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {}

export interface ProductFilters {
  page?: number
  per_page?: number
  sort?: string
  order?: 'asc' | 'desc'
  category?: string
  search?: string
  is_active?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

// ─── Coupon ──────────────────────────────────────────────────────────────────
export type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT'

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  max_uses: number | null
  used_count: number
  valid_until: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateCouponPayload {
  code: string
  type: CouponType
  value: number
  max_uses?: number
  valid_until?: string
  is_active?: boolean
}

export interface UpdateCouponPayload extends Partial<CreateCouponPayload> {}

// ─── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

export interface OrderItem {
  id: string
  product_id: string
  product_name: string
  variant_name?: string
  unit_price_in_cents: number
  quantity: number
}

export interface OrderAddress {
  zip_code: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
}

export interface Order {
  id: string
  user_id: string
  user?: { name: string; email: string }
  status: OrderStatus
  subtotal_in_cents: number
  discount_in_cents: number
  shipping_in_cents: number
  total_in_cents: number
  coupon_code?: string
  tracking_code?: string
  created_at: string
  updated_at: string
  items: OrderItem[]
  address?: OrderAddress
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus
  tracking_code?: string
}

// ─── API Error ───────────────────────────────────────────────────────────────
export interface ApiError {
  statusCode: number
  error: string
  message: string | string[]
}
