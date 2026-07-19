import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cart, CartItem, CartItemInput } from '../types';

function buildKey(productId: string, variantId?: string | null) {
  return `${productId}:${variantId ?? 'default'}`;
}

function mapToCartItem(item: CartItemInput): CartItem {
  if (!item.product) {
    throw new Error('Product snapshot is required for guest cart items');
  }

  const stock = item.variant?.stock ?? item.product.stock;
  const unitPrice = item.product.price_in_cents + (item.variant?.price_modifier_in_cents ?? 0);
  const quantity = Math.min(item.quantity, stock > 0 ? stock : item.quantity);

  return {
    id: buildKey(item.product_id, item.variant_id),
    product_id: item.product_id,
    variant_id: item.variant_id ?? null,
    quantity,
    unit_price_in_cents: unitPrice,
    line_total_in_cents: unitPrice * quantity,
    stock,
    product: item.product,
    variant: item.variant ?? null,
  };
}

function recalc(items: CartItem[]): Cart {
  return {
    id: 'guest-cart',
    items,
    total_items: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal_in_cents: items.reduce((sum, item) => sum + item.line_total_in_cents, 0),
  };
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItemInput) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null | undefined, quantity: number) => void;
  clearCart: () => void;
  mergeWithServer: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        if (!item.product) {
          return;
        }

        const nextItem = mapToCartItem(item);
        const key = buildKey(item.product_id, item.variant_id);
        const items = get().items.slice();
        const existingIndex = items.findIndex((current) => current.id === key);

        if (existingIndex >= 0) {
          const current = items[existingIndex];
          const quantity = Math.min(current.quantity + nextItem.quantity, nextItem.stock);
          items[existingIndex] = {
            ...current,
            quantity,
            line_total_in_cents: quantity * current.unit_price_in_cents,
          };
        } else {
          items.push(nextItem);
        }

        set(() => ({ items }));
      },
      removeItem: (productId, variantId) => {
        set({
          items: get().items.filter((item) => item.id !== buildKey(productId, variantId)),
        });
      },
      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set({
          items: get().items.map((item) => {
            if (item.id !== buildKey(productId, variantId)) {
              return item;
            }

            const nextQuantity = Math.min(quantity, item.stock > 0 ? item.stock : quantity);
            return {
              ...item,
              quantity: nextQuantity,
              line_total_in_cents: nextQuantity * item.unit_price_in_cents,
            };
          }),
        });
      },
      clearCart: () => set({ items: [] }),
      mergeWithServer: (items) => set({ items }),
    }),
    {
      name: 'atelier-guest-cart',
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function buildCartFromItems(items: CartItem[]) {
  return recalc(items);
}
