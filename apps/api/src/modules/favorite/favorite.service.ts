import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FavoriteRepository } from './favorite.repository';
import { FavoriteEntity } from './entities/favorite.entity';

@Injectable()
export class FavoriteService {
  constructor(private readonly favoriteRepository: FavoriteRepository) {}

  async findAll(userId: string): Promise<FavoriteEntity[]> {
    const favorites = await this.favoriteRepository.findAllByUserId(userId);
    return favorites.map((favorite) => this.toEntity(favorite));
  }

  async create(userId: string, productId: string): Promise<FavoriteEntity> {
    const product = await this.favoriteRepository.findProductById(productId);
    if (!product || !product.isActive || product.deletedAt) {
      throw new NotFoundException('Produto não encontrado');
    }

    const existing = await this.favoriteRepository.findByUserAndProduct(userId, productId);
    if (existing) {
      throw new ConflictException('Produto já favoritado');
    }

    const favorite = await this.favoriteRepository.create(userId, productId);
    return this.toEntity(favorite);
  }

  async remove(userId: string, productId: string): Promise<{ success: boolean }> {
    const existing = await this.favoriteRepository.findByUserAndProduct(userId, productId);
    if (!existing) {
      throw new NotFoundException('Favorito não encontrado');
    }

    await this.favoriteRepository.delete(userId, productId);
    return { success: true };
  }

  private toEntity(favorite: {
    id: string;
    productId: string;
    createdAt: Date;
    product: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      priceInCents: number;
      isActive: boolean;
      isFeatured: boolean;
      stock: number;
      category: { id: string; name: string; slug: string };
      images: Array<{ id: string; url: string; position: number }>;
    };
  }): FavoriteEntity {
    return {
      id: favorite.id,
      product_id: favorite.productId,
      created_at: favorite.createdAt,
      product: {
        id: favorite.product.id,
        name: favorite.product.name,
        slug: favorite.product.slug,
        description: favorite.product.description,
        price_in_cents: favorite.product.priceInCents,
        is_active: favorite.product.isActive,
        is_featured: favorite.product.isFeatured,
        stock: favorite.product.stock,
        is_available: favorite.product.stock > 0,
        category: {
          id: favorite.product.category.id,
          name: favorite.product.category.name,
          slug: favorite.product.category.slug,
        },
        images: favorite.product.images.map((image) => ({
          id: image.id,
          url: image.url,
          position: image.position,
        })),
      },
    };
  }
}
