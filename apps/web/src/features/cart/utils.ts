import type { Product } from '../catalog/types';
import type { CartItemInput, CartVariantSnapshot } from './types';

// Payload que vai para a API — só o que o backend aceita
export function toCartApiPayload(
  product: Product,
  quantity = 1,
  variant?: CartVariantSnapshot | null,
) {
  return {
    product_id: product.id,
    variant_id: variant?.id ?? null,
    quantity,
  }
}

// Snapshot completo para o carrinho local (Zustand / guest)
export function toCartItemInput(
  product: Product,
  quantity = 1,
  variant?: CartVariantSnapshot | null,
): CartItemInput {
  return {
    product_id: product.id,
    variant_id: variant?.id ?? null,
    quantity,
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price_in_cents: product.price_in_cents,
      stock: product.stock,
      is_active: product.is_active,
      image: product.images[0]
        ? {
            id: product.images[0].id,
            url: product.images[0].url,
            position: product.images[0].position,
          }
        : null,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
    },
    variant: variant ?? null,
  }
}