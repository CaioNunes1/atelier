import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const FAVORITE_INCLUDE = {
  product: {
    include: {
      category: true,
      images: {
        orderBy: { position: 'asc' },
      },
    },
  },
} satisfies Prisma.FavoriteInclude;

type FavoriteWithRelations = Prisma.FavoriteGetPayload<{ include: typeof FAVORITE_INCLUDE }>;

@Injectable()
export class FavoriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUserId(userId: string) {
    return this.prisma.favorite.findMany({
      where: {
        userId,
        product: {
          isActive: true,
          deletedAt: null,
        },
      },
      include: FAVORITE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByUserAndProduct(userId: string, productId: string) {
    return this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      include: FAVORITE_INCLUDE,
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
      },
    });
  }

  create(userId: string, productId: string) {
    return this.prisma.favorite.create({
      data: {
        userId,
        productId,
      },
      include: FAVORITE_INCLUDE,
    });
  }

  delete(userId: string, productId: string) {
    return this.prisma.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  mapFavorite(favorite: FavoriteWithRelations) {
    return favorite;
  }
}
