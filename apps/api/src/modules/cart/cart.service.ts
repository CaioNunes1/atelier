import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Product, ProductVariant } from '@prisma/client';
import { CartRepository } from './cart.repository';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartEntity, CartItemEntity } from './entities/cart.entity';

type CartProduct = Product & {
  category: { id: string; name: string; slug: string };
  images: Array<{ id: string; url: string; position: number }>;
  variants?: ProductVariant[];
};

@Injectable()
export class CartService {
  constructor(private readonly cartRepository: CartRepository) {}

  async getCart(userId: string): Promise<CartEntity> {
    const cart = await this.cartRepository.findOrCreateForUser(userId);
    await this.cartRepository.removeInactiveItems(cart.id);
    const refreshed = await this.cartRepository.findByUserId(userId);
    if (!refreshed) {
      throw new NotFoundException('Carrinho não encontrado');
    }

    return this.toEntity(refreshed);
  }

  async addItem(userId: string, dto: CreateCartItemDto): Promise<CartEntity> {
    return this.cartRepository.transactional(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { userId } });
      const resolvedCart = cart ?? (await tx.cart.create({ data: { userId } }));
      const product = await tx.product.findUnique({
        where: { id: dto.product_id },
        include: {
          category: true,
          images: { orderBy: { position: 'asc' } },
          variants: true,
        },
      });

      const validation = this.validateProductForCart(product, dto.variant_id);
      const requestedQuantity = dto.quantity;
      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId: resolvedCart.id,
          productId: dto.product_id,
          variantId: dto.variant_id ?? null,
        },
      });

      const currentQuantity = existingItem?.quantity ?? 0;
      const nextQuantity = currentQuantity + requestedQuantity;
      if (nextQuantity > validation.stock) {
        throw new BadRequestException('Quantidade indisponível em estoque');
      }

      if (existingItem) {
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: nextQuantity },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: resolvedCart.id,
            productId: dto.product_id,
            variantId: dto.variant_id ?? null,
            quantity: requestedQuantity,
          },
        });
      }

      const cartWithItems = await this.loadCart(tx, userId);
      return this.toEntity(cartWithItems);
    });
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<CartEntity> {
    return this.cartRepository.transactional(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (!cart) {
        throw new NotFoundException('Carrinho não encontrado');
      }

      const item = await tx.cartItem.findUnique({
        where: { id: itemId },
        include: {
          product: {
            include: {
              category: true,
              images: { orderBy: { position: 'asc' } },
              variants: true,
            },
          },
          variant: true,
        },
      });

      if (!item || item.cartId !== cart.id) {
        throw new NotFoundException('Item não encontrado');
      }

      const validation = this.validateProductForCart(item.product, item.variantId ?? undefined);
      if (dto.quantity > validation.stock) {
        throw new BadRequestException('Quantidade indisponível em estoque');
      }

      await tx.cartItem.update({
        where: { id: item.id },
        data: { quantity: dto.quantity },
      });

      const refreshed = await this.loadCart(tx, userId);
      return this.toEntity(refreshed);
    });
  }

  async removeItem(userId: string, itemId: string): Promise<CartEntity> {
    return this.cartRepository.transactional(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (!cart) {
        throw new NotFoundException('Carrinho não encontrado');
      }

      const item = await tx.cartItem.findUnique({ where: { id: itemId } });
      if (!item || item.cartId !== cart.id) {
        throw new NotFoundException('Item não encontrado');
      }

      await tx.cartItem.delete({ where: { id: item.id } });
      const refreshed = await this.loadCart(tx, userId);
      return this.toEntity(refreshed);
    });
  }

  async clearCart(userId: string): Promise<CartEntity> {
    return this.cartRepository.transactional(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (!cart) {
        throw new NotFoundException('Carrinho não encontrado');
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      const refreshed = await this.loadCart(tx, userId);
      return this.toEntity(refreshed);
    });
  }

  async mergeCart(userId: string, dto: MergeCartDto): Promise<CartEntity> {
    return this.cartRepository.transactional(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { userId } });
      const resolvedCart = cart ?? (await tx.cart.create({ data: { userId } }));

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.product_id },
          include: {
            category: true,
            images: { orderBy: { position: 'asc' } },
            variants: true,
          },
        });

        if (!product || !product.isActive || product.deletedAt) {
          continue;
        }

        let validation: { stock: number };
        try {
          validation = this.validateProductForCart(product, item.variant_id);
        } catch {
          continue;
        }

        if (validation.stock <= 0) {
          continue;
        }

        const existingItem = await tx.cartItem.findFirst({
          where: {
            cartId: resolvedCart.id,
            productId: item.product_id,
            variantId: item.variant_id ?? null,
          },
        });

        const nextQuantity = Math.min(validation.stock, (existingItem?.quantity ?? 0) + item.quantity);
        if (nextQuantity <= 0) {
          continue;
        }

        if (existingItem) {
          await tx.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: nextQuantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: resolvedCart.id,
              productId: item.product_id,
              variantId: item.variant_id ?? null,
              quantity: nextQuantity,
            },
          });
        }
      }

      const refreshed = await this.loadCart(tx, userId);
      return this.toEntity(refreshed);
    });
  }

  private async loadCart(tx: Prisma.TransactionClient, userId: string) {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            product: {
              include: {
                category: true,
                images: { orderBy: { position: 'asc' } },
                variants: true,
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException('Carrinho não encontrado');
    }

    return cart;
  }

  private validateProductForCart(product: CartProduct | null, variantId?: string): { stock: number } {
    if (!product || !product.isActive || product.deletedAt) {
      throw new BadRequestException('Produto desativado');
    }

    if (variantId) {
      const variants = product.variants ?? [];
      const variant = variants.find((current) => current.id === variantId);
      if (!variant) {
        throw new BadRequestException('Variação inválida');
      }
      return { stock: variant.stock };
    }

    return { stock: product.stock };
  }

  private toEntity(cart: {
    id: string;
    items: Array<{
      id: string;
      productId: string;
      variantId: string | null;
      quantity: number;
      product: CartProduct;
      variant: ProductVariant | null;
    }>;
  }): CartEntity {
    const items = cart.items.map((item) => this.toItemEntity(item));
    return {
      id: cart.id,
      items,
      total_items: items.reduce((sum, current) => sum + current.quantity, 0),
      subtotal_in_cents: items.reduce((sum, current) => sum + current.line_total_in_cents, 0),
    };
  }

  private toItemEntity(item: {
    id: string;
    productId: string;
    variantId: string | null;
    quantity: number;
    product: CartProduct;
    variant: ProductVariant | null;
  }): CartItemEntity {
    const image = item.product.images[0] ?? null;
    const variantPriceModifier = item.variant?.priceModifierInCents ?? 0;
    const unitPrice = item.product.priceInCents + variantPriceModifier;
    const stock = item.variant?.stock ?? item.product.stock;

    return {
      id: item.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price_in_cents: unitPrice,
      line_total_in_cents: unitPrice * item.quantity,
      stock,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price_in_cents: item.product.priceInCents,
        stock: item.product.stock,
        is_active: item.product.isActive,
        image,
        category: {
          id: item.product.category.id,
          name: item.product.category.name,
          slug: item.product.category.slug,
        },
      },
      variant: item.variant
        ? {
            id: item.variant.id,
            name: item.variant.name,
            stock: item.variant.stock,
            price_modifier_in_cents: item.variant.priceModifierInCents,
          }
        : null,
    };
  }
}
