import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const CART_INCLUDE = {
  items: {
    orderBy: { createdAt: 'asc' },
    include: {
      product: {
        include: {
          category: true,
          images: {
            orderBy: { position: 'asc' },
          },
        },
      },
      variant: true,
    },
  },
} satisfies Prisma.CartInclude;

type CartWithRelations = Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: CART_INCLUDE,
    });
  }

  createForUser(userId: string) {
    return this.prisma.cart.create({
      data: { userId },
      include: CART_INCLUDE,
    });
  }

  findOrCreateForUser(userId: string) {
    return this.findByUserId(userId).then((cart) => {
      if (cart) {
        return cart;
      }

      return this.createForUser(userId);
    });
  }

  findItem(cartId: string, productId: string, variantId: string | null) {
    return this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        variantId,
      },
      include: {
        product: {
          include: {
            category: true,
            images: {
              orderBy: { position: 'asc' },
            },
          },
        },
        variant: true,
      },
    });
  }

  findItemById(itemId: string) {
    return this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        product: {
          include: {
            category: true,
            images: {
              orderBy: { position: 'asc' },
            },
          },
        },
        variant: true,
      },
    });
  }

  createItem(data: {
    cartId: string;
    productId: string;
    variantId: string | null;
    quantity: number;
  }) {
    return this.prisma.cartItem.create({
      data,
      include: {
        product: {
          include: {
            category: true,
            images: {
              orderBy: { position: 'asc' },
            },
          },
        },
        variant: true,
      },
    });
  }

  updateItem(itemId: string, quantity: number) {
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: {
          include: {
            category: true,
            images: {
              orderBy: { position: 'asc' },
            },
          },
        },
        variant: true,
      },
    });
  }

  deleteItem(itemId: string) {
    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  clearItems(cartId: string) {
    return this.prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }

  removeInactiveItems(cartId: string) {
    return this.prisma.cartItem.deleteMany({
      where: {
        cartId,
        product: {
          isActive: false,
          deletedAt: null,
        },
      },
    });
  }

  findProductById(productId: string) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        images: {
          orderBy: { position: 'asc' },
        },
        variants: true,
      },
    });
  }

  findVariantById(variantId: string) {
    return this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
  }

  async transactional<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  mapCart(cart: CartWithRelations) {
    return cart;
  }
}
